<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    as?: string;
    level?: 1 | 2 | 3;
    glass?: boolean;
  }>(),
  { as: 'div', glass: false },
);

const level = useSurfaceLevel(() => props.level);
</script>

<template>
  <component
    :is="props.as"
    class="k-surface"
    :class="{ 'k-glass': props.glass }"
    :data-level="level">
    <slot />
  </component>
</template>
