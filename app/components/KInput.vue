<script setup lang="ts">
defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    textarea?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    maxlength?: number;
  }>(),
  { textarea: false, clearable: false, disabled: false },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  clear: [];
}>();

const attrs = useAttrs();
const rootClass = computed(() => attrs.class);
const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const innerRef = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>('inner');

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
};

const onClear = () => {
  emit('update:modelValue', '');
  emit('clear');
};

defineExpose({
  focus: () => innerRef.value?.focus(),
});
</script>

<template>
  <div class="relative w-full" :class="rootClass">
    <textarea
      v-if="textarea"
      ref="inner"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      v-bind="inputAttrs"
      class="w-full rounded-md border border-white/20 bg-black/10 p-3 text-sm outline-none backdrop-blur-xs transition-bg duration-300 placeholder:text-white/40 focus:border-(--color-theme) focus:ring-2 focus:ring-(--color-theme) disabled:opacity-60"
      @input="onInput" />
    <input
      v-else
      ref="inner"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      v-bind="inputAttrs"
      class="w-full rounded-md border border-white/20 bg-black/10 p-3 text-sm outline-none backdrop-blur-xs transition-bg duration-300 placeholder:text-white/40 focus:border-(--color-theme) focus:ring-2 focus:ring-(--color-theme) disabled:opacity-60"
      @input="onInput" />
    <button
      v-if="clearable && modelValue"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 transition-color duration-300 hover:text-white"
      @click="onClear">
      <span class="material-symbols-outlined text-lg"> close </span>
    </button>
  </div>
</template>
