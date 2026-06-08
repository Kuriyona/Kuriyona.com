<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
  },
});
</script>

<template>
  <div
    class="p-4 backdrop-brightness-50 backdrop-blur-sm rounded-xl text-white/80 border border-white/5 text-sm"
    :class="{ 'shadow-lg shadow-white/3': $attrs.level !== undefined }">
    <h2 v-if="props.title" class="text-lg font-bold mb-4">{{ props.title }}</h2>
    <slot />
  </div>
</template>
