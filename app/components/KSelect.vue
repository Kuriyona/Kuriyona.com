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
      class="flex w-full items-center justify-between gap-2 rounded-md border border-white/20 bg-black/10 px-3 py-2 text-sm outline-none backdrop-blur-xs transition-bg duration-300 hover:bg-white/5 focus:border-(--color-theme) focus:ring-2 focus:ring-(--color-theme) disabled:opacity-60">
      <SelectValue :placeholder="props.placeholder" />
      <SelectIcon class="text-white/50">
        <span class="material-symbols-outlined text-base leading-none"> expand_more </span>
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="z-700 max-h-60 min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-lg border border-white/5 bg-black p-2 shadow-lg shadow-black/40">
        <SelectViewport>
          <SelectItem
            v-for="opt in props.options"
            :key="opt.value"
            :value="opt.value"
            class="relative flex cursor-pointer items-center rounded-md py-1.5 pr-8 pl-2 text-sm text-white/80 outline-none select-none transition-bg duration-200 data-[highlighted]:bg-white/10 data-[highlighted]:text-white">
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
