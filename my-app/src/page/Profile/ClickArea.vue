<script setup lang="ts">
withDefaults(defineProps<{ className?: string }>(), { className: '' })
const emit = defineEmits<{ (e: 'action'): void }>()
</script>

<template>
  <div :class="className" @click="emit('action')">
    <slot />
  </div>
</template>