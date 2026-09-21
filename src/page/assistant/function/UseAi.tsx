import { useState, useRef, useEffect, useCallback } from 'react';
import { streamChat, checkHealth } from '../../../api/ai';
import type { MatchResult } from '../../../api/ai';

export type { MatchResult };
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  matches?: MatchResult[];
  isStreaming?: boolean;
}

type Status = 'connecting' | 'ready' | 'error';

export function useCompanyAI() {
  const [status, setStatus] = useState<Status>('connecting');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState('');
  const [modelName, setModelName] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkHealth()
      .then((data) => {
        if (cancelled) return;
        setModelName(data.model);
        setStatus('ready');
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus('error');
        setError('无法连接后端服务，请确认 FastAPI 已启动（默认 http://localhost:8000）');
      });
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (userText: string) => {
    if (status !== 'ready') return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: userText },
    ]);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ]);

    let acc = '';
    try {
      await streamChat(
        userText,
        {
          onMatches: (matches) =>
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, matches } : m))
            ),
          onDelta: (text) => {
            acc += text;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
            );
          },
          onError: (msg) => {
            acc += `\n⚠️ ${msg}`;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
            );
          },
        },
        abortRef.current.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || '❌ 网络错误，请稍后重试', isStreaming: false }
              : m
          )
        );
      }
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      );
    }
  }, [status]);

  return {
    messages, sendMessage, stopStreaming, clearMessages,
    status, error, modelName,
    isReady: status === 'ready',
    isGenerating: messages.some((m) => m.isStreaming),
  };
}