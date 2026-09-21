const BASE = import.meta.env.VITE_API_URL as string;

export interface Company {
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

interface StreamHandlers {
  onMatches: (matches: MatchResult[]) => void;
  onDelta: (text: string) => void;
  onError: (msg: string) => void;
}

function getToken() {
  return sessionStorage.getItem("token") || "";
}

/** 检查后端与模型状态 */
export async function checkHealth(): Promise<{ model: string; index_size: number }> {
  const res = await fetch(`${BASE}/api/health`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const json = await res.json();
  return json.data;
}

/** 流式对话：解析 SSE，依次回调 matches / delta / error */
export async function streamChat(
  message: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ message, top_k: 3 }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`请求失败: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "";
  let data = "";

  const dispatch = () => {
    if (!data) return;
    if (event === "matches") {
      const raw = JSON.parse(data) as (Company & { score: number })[];
      handlers.onMatches(
        raw.map((m) => ({ company: m, score: m.score }))
      );
    } else if (event === "delta") {
      handlers.onDelta(data);
    } else if (event === "error") {
      handlers.onError(data);
    }
    event = "";
    data = "";
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trimEnd();
      buffer = buffer.slice(idx + 1);
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
      else if (line === "") dispatch(); // 空行 = 一个事件结束
    }
  }
  dispatch();
}