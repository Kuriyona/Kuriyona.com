<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    width?: string;
    closeOnBackdrop?: boolean;
    teleport?: boolean;
  }>(),
  {
    title: '',
    width: 'max-w-md',
    closeOnBackdrop: true,
    teleport: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

watch(
  () => props.modelValue,
  (value, prev) => {
    if (prev && !value) emit('close');
  },
);

function onPointerDownOutside(event: Event) {
  if (!props.closeOnBackdrop) event.preventDefault();
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal :disabled="!props.teleport">
      <DialogOverlay
        class="fixed inset-0 z-500 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm data-[state=open]:animate-[k-dialog-fade_0.18s_ease-out]">
        <DialogContent
          class="w-full outline-none data-[state=open]:animate-[k-dialog-in_0.18s_ease-out]"
          :class="props.width"
          :aria-describedby="undefined"
          @pointer-down-outside="onPointerDownOutside">
          <KCard class="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6! shadow-xl">
            <div class="flex shrink-0 items-center justify-between gap-4">
              <DialogTitle class="flex min-w-0 items-center gap-2 text-base font-bold">
                <slot name="title">{{ props.title }}</slot>
              </DialogTitle>
              <KIconButton
                icon="close"
                size="sm"
                label="Close"
                class="-mr-1 shrink-0"
                @click="open = false" />
            </div>
            <slot />
            <slot name="footer" />
          </KCard>
        </DialogContent>
      </DialogOverlay>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
@keyframes k-dialog-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes k-dialog-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
