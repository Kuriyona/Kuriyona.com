<script setup lang="ts">
import { toast } from '~/composables/useToast';

const toasts = toast.list;
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-10000 flex flex-col items-center gap-2">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="k-surface px-4 py-2 rounded-md text-sm"
        data-level="3"
        :class="item.type === 'success' ? 'text-(--color-theme)' : 'text-red-400'">
        {{ item.text }}
      </div>
    </div>
  </Teleport>
</template>
