<script setup lang="ts">
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
  }>(),
  { placeholder: '' },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <SelectRoot
    :model-value="props.modelValue"
    :disabled="props.disabled"
    @update:model-value="emit('update:modelValue', $event as string)">
    <SelectTrigger
      v-bind="$attrs"
      class="k-interactive [--interactive-base:var(--color-surface-inset)] flex w-full items-center justify-between gap-2 rounded-md border border-(--color-line-strong) bg-(--color-surface-inset) px-3 py-2 text-sm outline-none focus:border-(--color-theme) focus:ring-2 focus:ring-(--color-theme) disabled:opacity-60">
      <SelectValue :placeholder="props.placeholder" />
      <SelectIcon class="text-(--color-text-3)">
        <span class="material-symbols-outlined text-base leading-none"> expand_more </span>
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="k-surface z-700 max-h-60 min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-lg p-2"
        data-level="3">
        <SelectViewport>
          <SelectItem
            v-for="opt in props.options"
            :key="opt.value"
            :value="opt.value"
            class="relative flex cursor-pointer items-center rounded-md py-1.5 pr-8 pl-2 text-sm text-(--color-text-2) outline-none select-none transition-colors duration-200 data-[highlighted]:bg-(--color-hover) data-[highlighted]:text-(--color-text-1)">
            <SelectItemText>{{ opt.label }}</SelectItemText>
            <SelectItemIndicator class="absolute right-2 text-(--color-theme)">
              <span class="material-symbols-outlined text-base leading-none"> check </span>
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
