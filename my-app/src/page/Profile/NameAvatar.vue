<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 40 })

const AVATAR_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#ec4899']
const color = computed(() => AVATAR_COLORS[props.name.length % AVATAR_COLORS.length])
</script>

<template>
  <a-avatar :size="size" :style="{ background: color, fontSize: size * 0.4 }">{{ name.slice(0, 1) }}</a-avatar>
</template>