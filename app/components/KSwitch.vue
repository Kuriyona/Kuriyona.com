<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: boolean;
    disabled?: boolean;
  }>(),
  { modelValue: false, disabled: false },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="relative h-6 w-11 rounded-full transition-bg duration-300 focus:outline-none focus:ring-2 focus:ring-(--color-theme) disabled:opacity-50"
    :class="modelValue ? 'bg-(--color-theme)' : 'bg-white/20'"
    @click="emit('update:modelValue', !modelValue)">
    <span
      class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
      :class="modelValue ? 'translate-x-5' : ''" />
  </button>
</template>
