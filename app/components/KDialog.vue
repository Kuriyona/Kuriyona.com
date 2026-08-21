<script setup lang="ts">
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

const dialogRef = ref<HTMLDialogElement | null>(null);

function closeDialog() {
  emit('update:modelValue', false);
  emit('close');
}

watch(
  () => props.modelValue,
  (open) => {
    nextTick(() => {
      const dialog = dialogRef.value;
      if (!dialog) return;
      if (open && !dialog.open) dialog.showModal();
      else if (!open && dialog.open) dialog.close();
    });
  },
  { immediate: true },
);

function onDialogClick(e: MouseEvent) {
  if (!props.closeOnBackdrop) return;
  const dialog = dialogRef.value;
  if (!dialog) return;
  const rect = dialog.getBoundingClientRect();
  const isInside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;
  if (!isInside) closeDialog();
}
</script>

<template>
  <Teleport to="body" :disabled="!props.teleport">
    <dialog
      ref="dialogRef"
      class="m-auto w-full bg-transparent outline-none"
      :class="[props.width]"
      @close="closeDialog"
      @click="onDialogClick">
      <KCard class="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6! shadow-xl">
        <div class="flex shrink-0 items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-2 text-base font-bold">
            <slot name="title">{{ props.title }}</slot>
          </div>
          <KIconButton
            icon="close"
            size="sm"
            label="Close"
            class="-mr-1 shrink-0"
            @click="closeDialog" />
        </div>
        <slot />
        <slot name="footer" />
      </KCard>
    </dialog>
  </Teleport>
</template>

<style scoped>
dialog[open] {
  animation: k-dialog-in 0.18s ease-out;
}

dialog::backdrop {
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(4px);
  animation: k-dialog-fade 0.18s ease-out;
}

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
