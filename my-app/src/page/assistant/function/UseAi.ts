import { computed, onMounted, onUnmounted, ref } from 'vue'
import { streamChat, checkHealth } from '../../../api/ai'
import type { MatchResult } from '../../../api/ai'

export type { MatchResult }
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  matches?: MatchResult[]
  isStreaming?: boolean
}

type Status = 'connecting' | 'ready' | 'error'

export function useCompanyAI() {
  const status = ref<Status>('connecting')
  const messages = ref<ChatMessage[]>([])
  const error = ref('')
  const modelName = ref('')
  let abortRef: AbortController | null = null

  onMounted(() => {
    checkHealth()
      .then((data) => {
        modelName.value = data.model
        status.value = 'ready'
      })
      .catch(() => {
        status.value = 'error'
        error.value = '无法连接后端服务，请确认 FastAPI 已启动（默认 http://localhost:8000）'
      })
  })

  onUnmounted(() => {
    abortRef?.abort()
  })

  function stopStreaming() {
    abortRef?.abort()
    messages.value = messages.value.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
  }

  function clearMessages() {
    abortRef?.abort()
    messages.value = []
  }

  async function sendMessage(userText: string) {
    if (status.value !== 'ready') return

    abortRef?.abort()
    abortRef = new AbortController()

    messages.value = [...messages.value, { id: Date.now().toString(), role: 'user', content: userText }]

    const assistantId = (Date.now() + 1).toString()
    messages.value = [...messages.value, { id: assistantId, role: 'assistant', content: '', isStreaming: true }]

    let acc = ''
    try {
      await streamChat(
        userText,
        {
          onMatches: (matches) =>
            (messages.value = messages.value.map((m) => (m.id === assistantId ? { ...m, matches } : m))),
          onDelta: (text) => {
            acc += text
            messages.value = messages.value.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
          },
          onError: (msg) => {
            acc += `\n⚠️ ${msg}`
            messages.value = messages.value.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
          },
        },
        abortRef.signal,
      )
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        messages.value = messages.value.map((m) =>
          m.id === assistantId
            ? { ...m, content: m.content || '❌ 网络错误，请稍后重试', isStreaming: false }
            : m,
        )
      }
    } finally {
      messages.value = messages.value.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
    }
  }

  return {
    messages,
    sendMessage,
    stopStreaming,
    clearMessages,
    status,
    error,
    modelName,
    isReady: computed(() => status.value === 'ready'),
    isGenerating: computed(() => messages.value.some((m) => m.isStreaming)),
  }
}