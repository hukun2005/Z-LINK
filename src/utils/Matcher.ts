import { pipeline, env } from '@huggingface/transformers';

// ========== 关键：强制本地加载，禁止联网下载 ==========
env.allowRemoteModels = false;   // 禁止从 HuggingFace 下载
env.allowLocalModels = true;     // 允许本地模型
env.localModelPath = `${window.location.origin}/models/`; // 指向 public/models/ 目录
// ======================================================

export async function createEmbedder(options?: {
  progress_callback?: (p: number) => void;
  device?: 'webgpu' | 'wasm' | 'cpu' | 'auto';
}) {
  return pipeline('feature-extraction', 'bge-small-en', {
    device: 'wasm',
    dtype: 'fp32',
    ...options,
  } as any);
}

export async function embed(embedder: any, text: string): Promise<number[]> {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}