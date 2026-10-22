<script setup lang="ts">
import ClickArea from './ClickArea.vue'
import NameAvatar from './NameAvatar.vue'
import type { Contact } from '../../api/messages'

const props = defineProps<{ c: Contact; active: boolean }>()
const emit = defineEmits<{ (e: 'open', name: string): void }>()
</script>

<template>
  <ClickArea
    :class="`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${props.active ? 'bg-blue-50' : 'hover:bg-gray-50'}`"
    @action="emit('open', props.c.contact)"
  >
    <a-badge :count="props.c.unread" size="small" :offset="[-4, 4]">
      <NameAvatar :name="props.c.contact" :size="40" />
    </a-badge>
    <div class="flex-1 min-w-0">
      <div class="text-sm text-gray-900 truncate">{{ props.c.contact }}</div>
      <div class="text-xs text-gray-400 truncate mt-0.5">{{ props.c.last_role === 'me' ? '我: ' : '' }}{{ props.c.last_content }}</div>
    </div>
  </ClickArea>
</template>