<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    icon: string;
    size?: 'sm' | 'base' | 'md' | 'lg' | 'xl';
    label?: string;
    iconClass?: string;
  }>(),
  { size: 'md', iconClass: '' },
);

const sizeClass = {
  sm: 'text-sm!',
  base: 'text-base!',
  md: 'text-lg!',
  lg: 'text-2xl!',
  xl: 'text-3xl!',
}[props.size];
</script>

<template>
  <KButton
    round
    v-bind="$attrs"
    :aria-label="label || icon"
    translate="no"
    data-pagefind-ignore
    class="shrink-0">
    <span
      aria-hidden="true"
      class="material-symbols-outlined leading-none select-none"
      :class="[sizeClass, props.iconClass]">
      {{ icon }}
    </span>
  </KButton>
</template>
