<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
  },
});
</script>

<template>
  <div class="p-4 backdrop-brightness-50 backdrop-blur-sm rounded-xl text-white/80 text-sm">
    <h2 v-if="props.title" class="text-lg font-bold mb-2">{{ props.title }}</h2>
    <slot />
  </div>
</template>
