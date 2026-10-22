<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { NotificationOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'
import ClickArea from './ClickArea.vue'
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications'
import type { Notification } from '../../api/notifications'

const TYPE_META: Record<string, { color: string; icon: any }> = {
  system: { color: 'blue', icon: NotificationOutlined },
  requirement: { color: 'orange', icon: FileTextOutlined },
  match: { color: 'green', icon: CheckCircleOutlined },
}

const notifications = ref<Notification[]>([])
const unread = ref(0)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const res: any = await getNotifications()
    notifications.value = res.data
    unread.value = res.unread
  } catch {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function handleRead(id: number) {
  try {
    await markAsRead(id)
    notifications.value = notifications.value.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    unread.value = Math.max(0, unread.value - 1)
  } catch {
    message.error('操作失败')
  }
}

async function handleReadAll() {
  try {
    await markAllAsRead()
    notifications.value = notifications.value.map((n) => ({ ...n, is_read: true }))
    unread.value = 0
    message.success('已全部标记为已读')
  } catch {
    message.error('操作失败')
  }
}
</script>

<template>
  <div v-if="loading" class="flex justify-center py-16">
    <a-spin />
  </div>
  <a-card v-else-if="notifications.length === 0" :bordered="false" class="shadow-sm">
    <a-empty description="暂无系统通知" />
  </a-card>
  <div v-else>
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm text-gray-500">{{ unread > 0 ? `${unread} 条未读` : '所有消息已查看' }}</span>
      <ClickArea v-if="unread > 0" @action="handleReadAll">
        <a-button type="primary" size="small">全部已读</a-button>
      </ClickArea>
    </div>
    <div class="space-y-3">
      <ClickArea
        v-for="n in notifications"
        :key="n.id"
        :class="`rounded-xl p-4 transition-all cursor-pointer border ${n.is_read ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-200 hover:shadow-md'}`"
        @action="!n.is_read && handleRead(n.id)"
      >
        <div class="flex items-start gap-3">
          <div
            class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white"
            :style="{ background: (TYPE_META[n.type] || TYPE_META.system).color === 'blue' ? '#3b82f6' : (TYPE_META[n.type] || TYPE_META.system).color === 'orange' ? '#f97316' : '#22c55e' }"
          >
            <component :is="(TYPE_META[n.type] || TYPE_META.system).icon" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <h3 :class="`text-sm ${n.is_read ? 'font-normal text-gray-600' : 'font-semibold text-gray-900'}`">{{ n.title }}</h3>
                <span v-if="!n.is_read" class="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              </div>
              <span class="text-[11px] text-gray-400 shrink-0">{{ n.created_at }}</span>
            </div>
            <p class="text-xs text-gray-600 mt-1 leading-relaxed">{{ n.content }}</p>
            <a-tag :color="(TYPE_META[n.type] || TYPE_META.system).color" class="text-[10px] mt-2 m-0">
              {{ n.type === 'system' ? '系统通知' : n.type === 'requirement' ? '需求动态' : '匹配结果' }}
            </a-tag>
          </div>
        </div>
      </ClickArea>
    </div>
  </div>
</template>