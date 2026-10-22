<script setup lang="ts">
import { ref } from 'vue'
import { BellOutlined, MessageOutlined } from '@ant-design/icons-vue'
import Header from '../shared/Header.vue'
import ChatTab from './Profile/ChatTab.vue'
import NoticeTab from './Profile/NoticeTab.vue'

const tab = ref<'chat' | 'notice'>('chat')
</script>

<template>
  <Header />
  <main class="max-w-4xl mx-auto px-4 pt-32 pb-12">
    <div class="mb-4">
      <h1 class="text-2xl font-semibold text-gray-900 flex items-center gap-2">
        <BellOutlined class="text-blue-500" />
        消息推送中心
      </h1>
    </div>
    <!-- 自定义标签切换 -->
    <div class="flex gap-1 border-b border-gray-100 mb-4">
      <button
        :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'chat' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`"
        @click="tab = 'chat'"
      >
        <MessageOutlined />
        联系人
      </button>
      <button
        :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'notice' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`"
        @click="tab = 'notice'"
      >
        <BellOutlined />
        系统通知
      </button>
    </div>
    <ChatTab v-if="tab === 'chat'" />
    <NoticeTab v-else />
  </main>
</template>