<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string;
    level?: 1 | 2 | 3;
    glass?: boolean;
  }>(),
  { glass: false },
);
</script>

<template>
  <KSurface
    :level="props.level"
    :glass="props.glass"
    class="p-4 rounded-xl text-sm text-(--color-text-1)">
    <h2 v-if="props.title" class="text-lg font-bold mb-4">{{ props.title }}</h2>
    <slot />
  </KSurface>
</template>
