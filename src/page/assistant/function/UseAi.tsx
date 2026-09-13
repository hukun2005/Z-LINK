import { useState, useRef, useEffect, useCallback } from 'react';
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';
import { getSuppliers } from '../../../api/suppliers';
import { createEmbedder, embed, cosineSimilarity } from '../../../utils/Matcher';

interface Company {
  id: number;
  name: string;
  describe: string;
  product: string;
  tags: string[];
}

export interface MatchResult {
  company: Company;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  matches?: MatchResult[];
  isStreaming?: boolean;
}

type Status = 'idle' | 'loading-embedder' | 'loading-llm' | 'indexing' | 'ready' | 'error';

export function useCompanyAI() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState('');

  const embedderRef = useRef<any>(null);
  const engineRef = useRef<MLCEngine | null>(null);
  const companiesRef = useRef<Company[]>([]);
  const companyEmbeddingsRef = useRef<Map<string, number[]>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (!navigator.gpu) {
          throw new Error('您的浏览器不支持 WebGPU，请使用 Chrome 126+ 或 Edge 126+');
        }

        // 1. 加载 Embedding 模型
        setStatus('loading-embedder');
        const embedder = await createEmbedder({
          progress_callback: (x: any) => {
            if (!cancelled) setProgress(x.progress * 0.15);
          },
        });
        if (cancelled) return;
        embedderRef.current = embedder;

        // 2. 加载对话模型（强制本地，不走 HuggingFace）
        setStatus('loading-llm');

        const modelId = 'Qwen2.5-3B-Instruct-q4f16_1-MLC';
        const appConfig = {
          model_list: [
            {
              model: `${window.location.origin}/models/${modelId}/resolve/main/`,
              model_id: modelId,
              model_lib: `${window.location.origin}/models/${modelId}/Qwen2.5-3B-Instruct-q4f16_1_cs1k-webgpu.wasm`,
              overrides: {
                context_window_size: 4096,
              },
            },
          ],
        };

        const engine = await CreateMLCEngine(
          modelId,
          {
            appConfig,
            initProgressCallback: (report) => {
              if (!cancelled) setProgress(0.15 + report.progress * 0.55);
            },
          }
        );

        if (cancelled) return;
        engineRef.current = engine;

        // 3. 加载供应商并预计算 Embedding
        const suppliersResponse = await getSuppliers({});
        const suppliers = suppliersResponse.data as Company[];
        if (!Array.isArray(suppliers)) {
          throw new Error('供应商数据格式错误');
        }
        companiesRef.current = suppliers;

        setStatus('indexing');
        for (let i = 0; i < suppliers.length; i++) {
          if (cancelled) return;
          const supplier = suppliers[i];
          const text = `${supplier.name} ${supplier.describe} ${supplier.product}`;
          const embedding = await embed(embedder, text);
          companyEmbeddingsRef.current.set(String(supplier.id), embedding);
          setProgress(0.7 + ((i + 1) / suppliers.length) * 0.3);
        }

        if (!cancelled) {
          setStatus('ready');
          setProgress(1);
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setError(err.message || '初始化失败');
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  const findMatches = useCallback(async (query: string, topK: number = 3): Promise<MatchResult[]> => {
    const queryEmb = await embed(embedderRef.current, query);
    const results: MatchResult[] = [];

    for (const company of companiesRef.current) {
      const companyEmb = companyEmbeddingsRef.current.get(String(company.id));
      if (companyEmb) {
        const score = cosineSimilarity(queryEmb, companyEmb);
        results.push({ company, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }, []);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!engineRef.current || status !== 'ready') return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userText,
      };
      setMessages((prev) => [...prev, userMsg]);

      const matches = await findMatches(userText, 3);

      const matchContext = matches
        .map((m, i) => {
          return `[${i + 1}] ${m.company.name}
匹配度: ${(m.score * 100).toFixed(1)}%
简介: ${m.company.describe}
产品: ${m.company.product}`;
        })
        .join('\n\n');

      const systemPrompt = `你是企业智能匹配助手。请根据用户的需求，从以下候选公司中推荐最合适的选择，并简要说明推荐理由。

候选公司信息：
${matchContext}

请用中文回答，格式如下：
1. 先直接回答推荐哪家公司
2. 给出详细的推荐理由（结合用户的具体需求）
3. 可以简要提及其他候选公司的适用场景`;

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          matches,
          isStreaming: true,
        },
      ]);

      try {
        const completion = await engineRef.current.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
        });

        let fullText = '';
        for await (const chunk of completion) {
          if (abortRef.current?.signal.aborted) break;
          const delta = chunk.choices[0]?.delta?.content ?? '';
          fullText += delta;

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
          );
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: '❌ 生成回复时出错，请重试', isStreaming: false }
                : m
            )
          );
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
        );
      }
    },
    [status, findMatches]
  );

  return { messages, sendMessage, status, progress, error, isReady: status === 'ready' };
}