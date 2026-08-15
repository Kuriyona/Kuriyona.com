<script setup lang="ts">
withDefaults(
  defineProps<{
    vertical?: boolean;
  }>(),
  { vertical: false },
);
</script>

<template>
  <div v-if="vertical" class="w-px self-stretch bg-white/10" />
  <div v-else class="h-px w-full bg-white/10" />
</template>
