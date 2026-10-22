<script setup lang="ts">
import { ref, watch } from 'vue'
import Header from '../../shared/Header.vue'
import { useCompanyAI } from './function/UseAi'
import type { MatchResult } from './function/UseAi'

const SUGGESTIONS = [
  '想找一家做精密机加工的供应商，要能通过 IATF16949 认证',
  '推荐做液压系统的企业，用于工程机械',
  '有没有擅长五轴加工、能做钛合金零件的厂家？',
  '找一家能做电镀和阳极氧化表面处理的工厂',
]

const input = ref('')
const scrollRef = ref<HTMLDivElement>()
const textareaRef = ref<HTMLTextAreaElement>()

const { messages, sendMessage, stopStreaming, clearMessages, isReady, isGenerating, status, error, modelName } =
  useCompanyAI()

watch(messages, () => {
  scrollRef.value?.scrollTo({ top: scrollRef.value.scrollHeight, behavior: 'smooth' })
})

function handleSubmit() {
  if (!input.value.trim() || !isReady.value || isGenerating.value) return
  sendMessage(input.value.trim())
  input.value = ''
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

function onInput(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function applySuggestion(s: string) {
  input.value = s
  textareaRef.value?.focus()
}

function matchPct(match: MatchResult) {
  return Math.min(Math.max(match.score, 0), 1) * 100
}
</script>

<template>
  <template v-if="status === 'error'">
    <Header />
    <div class="flex items-center justify-center h-125 bg-white rounded-xl border shadow-sm mt-30 max-w-3xl mx-auto">
      <div class="text-center px-6">
        <p class="text-lg font-medium text-red-500">后端连接失败</p>
        <p class="text-sm text-gray-600 mt-2">{{ error }}</p>
      </div>
    </div>
  </template>

  <template v-else>
    <Header />
    <div class="flex flex-col h-175 w-full max-w-3xl mx-auto border rounded-2xl shadow-lg bg-white overflow-hidden mt-30">
      <!-- 头部 -->
      <div class="px-5 py-3.5 border-b bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
        <div>
          <h2 class="font-bold text-white">🏢 AI 企业匹配助手</h2>
          <p class="text-xs text-blue-100 mt-0.5">语义检索 + 本地大模型 · {{ modelName || 'Mistral-Nemo' }}</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span :class="`w-2 h-2 rounded-full ${isReady ? 'bg-green-300 animate-pulse' : 'bg-yellow-300 animate-ping'}`" />
            <span class="text-xs text-blue-50">{{ isReady ? '就绪' : '连接中' }}</span>
          </div>
          <button @click="clearMessages" class="text-xs px-2.5 py-1 rounded-md bg-white/15 text-white hover:bg-white/25 transition-colors">
            清空对话
          </button>
        </div>
      </div>

      <!-- 消息区 -->
      <div ref="scrollRef" class="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/60">
        <div v-if="messages.length === 0" class="text-center text-gray-400 mt-16 space-y-4">
          <p class="text-3xl">👋</p>
          <p class="text-base font-medium text-gray-600">告诉我你的需求，我来匹配公司</p>
          <div class="flex flex-col items-center gap-2 mt-2">
            <button
              v-for="s in SUGGESTIONS"
              :key="s"
              @click="applySuggestion(s)"
              class="text-sm text-gray-500 bg-white border border-gray-200 rounded-full px-4 py-2 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all max-w-md"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <div v-for="msg in messages" :key="msg.id" :class="`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`">
          <div
            v-if="msg.role === 'user'"
            class="w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0"
          >
            我
          </div>
          <div
            v-else
            class="w-8 h-8 rounded-full bg-linear-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm shrink-0"
          >
            AI
          </div>
          <div :class="`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-white border border-gray-100 shadow-sm rounded-tl-sm text-gray-800'}`">
            <div v-if="msg.role === 'assistant' && msg.matches && msg.matches.length > 0" class="mb-3">
              <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                语义匹配结果 · Top {{ msg.matches.length }}
              </p>
              <RouterLink v-for="match in msg.matches" :key="match.company.id" :to="'/companies/' + match.company.id">
                <div class="border border-gray-100 rounded-xl p-3 mb-2 bg-gray-50/60 hover:bg-blue-50/50 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div class="flex justify-between items-center gap-2">
                    <h3 class="font-semibold text-gray-900 text-sm">{{ match.company.name }}</h3>
                    <span class="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                      {{ (match.score * 100).toFixed(1) }}%
                    </span>
                  </div>
                  <div class="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full" :style="{ width: `${matchPct(match)}%` }" />
                  </div>
                  <p class="text-xs text-gray-500 mt-2">主营：{{ match.company.product }}</p>
                  <div v-if="match.company.reason && match.company.reason.length" class="flex flex-wrap items-center gap-1 mt-2">
                    <span class="text-[10px] text-blue-500 font-medium">匹配要点：</span>
                    <span
                      v-for="r in match.company.reason"
                      :key="r"
                      class="text-[10px] px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 rounded"
                    >
                      {{ r }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-700 mt-1 line-clamp-2">{{ match.company.describe }}</p>
                  <div class="flex flex-wrap gap-1 mt-2">
                    <span v-for="tag in match.company.tags.slice(0, 5)" :key="tag" class="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 text-gray-500 rounded">
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </RouterLink>
            </div>
            <div class="whitespace-pre-wrap text-sm leading-relaxed">
              {{ msg.content || (msg.isStreaming ? '' : '…') }}
              <span v-if="msg.isStreaming" class="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse align-middle rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <form @submit.prevent="handleSubmit" class="p-4 bg-white border-t flex gap-2 items-end">
        <textarea
          ref="textareaRef"
          v-model="input"
          @input="onInput"
          @keydown="handleKeyDown"
          rows="1"
          placeholder="描述你的需求,Enter 发送,Shift+Enter 换行..."
          class="flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 resize-none"
        />
        <button
          v-if="isGenerating"
          type="button"
          @click="stopStreaming"
          class="px-5 py-2.5 bg-gray-600 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          停止
        </button>
        <button
          v-else
          type="submit"
          :disabled="!isReady || !input.trim()"
          class="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          发送
        </button>
      </form>
    </div>
  </template>
</template>