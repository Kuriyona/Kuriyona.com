<template>
  <span
    class="text-xs px-2 py-0.5 rounded-full"
    :class="
      props.variant === 'muted'
        ? 'bg-[var(--color-text-4)]/20 text-(--color-text-2)'
        : 'bg-[var(--color-theme)]/20 text-[var(--color-theme)]'
    ">
    <slot />
  </span>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{ variant?: 'theme' | 'muted' }>(), { variant: 'theme' });
</script>
