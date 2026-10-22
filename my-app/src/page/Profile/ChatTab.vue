<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { MessageOutlined, SendOutlined, UserOutlined } from '@ant-design/icons-vue'
import NameAvatar from './NameAvatar.vue'
import ContactRow from './ContactRow.vue'
import { getContacts, getMessages, sendMessage, readContact } from '../../api/messages'
import type { Message, Contact } from '../../api/messages'

const contacts = ref<Contact[]>([])
const activeContact = ref<string | null>(null)
const messages = ref<Message[]>([])
const loadingList = ref(true)
const loadingChat = ref(false)
const input = ref('')
const sending = ref(false)
const chatEndRef = ref<HTMLDivElement>()

async function loadContacts() {
  loadingList.value = true
  try {
    const res: any = await getContacts()
    contacts.value = res.data
  } catch {
    /* 拦截器已提示 */
  } finally {
    loadingList.value = false
  }
}

async function openChat(contact: string) {
  activeContact.value = contact
  loadingChat.value = true
  try {
    const res: any = await getMessages(contact)
    messages.value = res.data
    await readContact(contact)
    contacts.value = contacts.value.map((c) => (c.contact === contact ? { ...c, unread: 0 } : c))
  } catch {
    message.error('加载对话失败')
  } finally {
    loadingChat.value = false
  }
}

async function handleSend() {
  const content = input.value.trim()
  if (!content || !activeContact.value) return
  sending.value = true
  try {
    await sendMessage(activeContact.value, content)
    input.value = ''
    const res: any = await getMessages(activeContact.value)
    messages.value = res.data
    loadContacts()
  } catch {
    message.error('发送失败')
  } finally {
    sending.value = false
  }
}

onMounted(loadContacts)

watch(messages, () => {
  chatEndRef.value?.scrollIntoView({ behavior: 'smooth' })
})
</script>

<template>
  <div class="flex border border-gray-100 rounded-xl overflow-hidden bg-white h-[560px]">
    <!-- 左栏：联系人列表 -->
    <div class="w-64 shrink-0 border-r border-gray-100 overflow-y-auto">
      <div class="px-4 py-3 border-b border-gray-50 text-sm font-medium text-gray-700">联系人（{{ contacts.length }}）</div>
      <div v-if="loadingList" class="flex justify-center py-10">
        <a-spin />
      </div>
      <div v-else-if="contacts.length === 0" class="py-10">
        <a-empty description="暂无联系人" />
      </div>
      <ContactRow
        v-for="c in contacts"
        :key="c.contact"
        :c="c"
        :active="activeContact === c.contact"
        @open="openChat"
      />
    </div>

    <!-- 右栏：聊天窗口 -->
    <div class="flex-1 flex flex-col min-w-0">
      <div v-if="!activeContact" class="flex-1 flex items-center justify-center">
        <div class="text-center text-gray-400">
          <MessageOutlined class="text-4xl mb-3" />
          <p class="text-sm">选择一个联系人开始对话</p>
        </div>
      </div>
      <template v-else>
        <!-- 聊天头部 -->
        <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <NameAvatar :name="activeContact" :size="32" />
          <span class="font-medium text-gray-900">{{ activeContact }}</span>
          <a-tag color="green" class="text-[10px] m-0">供应商</a-tag>
        </div>

        <!-- 消息气泡 -->
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
          <div v-if="loadingChat" class="flex justify-center py-10">
            <a-spin />
          </div>
          <template v-else>
            <div v-for="m in messages" :key="m.id" :class="`flex gap-2 ${m.role === 'me' ? 'flex-row-reverse' : ''}`">
              <a-avatar v-if="m.role === 'me'" :size="32" :style="{ background: '#6366f1' }">
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <NameAvatar v-else :name="m.contact" :size="32" />
              <div :class="`max-w-[70%] ${m.role === 'me' ? 'text-right' : ''}`">
                <div :class="`inline-block px-3 py-2 rounded-xl text-sm leading-relaxed text-left ${m.role === 'me' ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`">
                  {{ m.content }}
                </div>
                <div class="text-[10px] text-gray-300 mt-1">{{ m.created_at }}</div>
              </div>
            </div>
            <div ref="chatEndRef" />
          </template>
        </div>

        <!-- 输入区 -->
        <div class="border-t border-gray-100 p-3 flex gap-2">
          <a-input
            v-model:value="input"
            placeholder="输入消息，按 Enter 发送..."
            :disabled="sending"
            @press-enter="handleSend"
          />
          <a-button type="primary" :loading="sending" @click="handleSend">
            <template #icon><SendOutlined /></template>
            发送
          </a-button>
        </div>
      </template>
    </div>
  </div>
</template>