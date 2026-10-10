<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui';

const props = withDefaults(
  defineProps<{
    direction?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
    modelValue?: boolean;
  }>(),
  {
    direction: 'bottom',
    align: 'start',
    modelValue: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <!-- Menu items placed in the default slot should be Reka UI's `DropdownMenuItem`
       (or one of its variants) for keyboard navigation and a11y to work. -->
  <DropdownMenuRoot v-model:open="open">
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :side="props.direction"
        :align="props.align"
        :side-offset="8"
        class="z-500 rounded-lg border border-white/5 bg-black p-2 outline-none">
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
