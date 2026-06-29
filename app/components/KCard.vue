<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
  },
});
</script>

<template>
  <div
    class="p-4 backdrop-brightness-75 bg-black/20 backdrop-blur-xs rounded-xl text-white/80 text-sm"
    :class="{ 'shadow-md shadow-white/2': $attrs.shadow !== undefined }">
    <h2 v-if="props.title" class="text-lg font-bold mb-4">{{ props.title }}</h2>
    <slot />
  </div>
</template>
