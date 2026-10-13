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
  sm: 'text-sm',
  base: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
}[props.size];

// icon 是完整 iconify 名（如 material-symbols:close）；无 label 时取末段当无障碍名
const ariaLabel = computed(() => props.label || props.icon.split(':').at(-1));
</script>

<template>
  <KButton round v-bind="$attrs" :aria-label="ariaLabel" class="shrink-0">
    <KIcon :name="icon" :class="[sizeClass, props.iconClass]" />
  </KButton>
</template>
