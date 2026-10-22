<script setup lang="ts">
withDefaults(defineProps<{ className?: string }>(), { className: '' })
</script>

<template>
  <div :class="`mx-auto max-w-7xl w-full px-5 sm:px-8 md:px-14 lg:px-5 ${className}`">
    <slot />
  </div>
</template>