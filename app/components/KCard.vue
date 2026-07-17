<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
  },
});
</script>

<template>
  <div
    class="p-4 backdrop-brightness-75 bg-black/10 backdrop-blur-xs rounded-xl text-white/80 text-sm shadow-lg shadow-white/2">
    <h2 v-if="props.title" class="text-lg font-bold mb-4">{{ props.title }}</h2>
    <slot />
  </div>
</template>
