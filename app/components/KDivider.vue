<script setup lang="ts">
import { Separator } from 'reka-ui';

defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    vertical?: boolean;
    /** 传入后在分隔线左端显示小字标签（仅 horizontal 生效） */
    label?: string;
  }>(),
  { vertical: false, label: '' },
);
</script>

<template>
  <div v-if="label && !vertical" v-bind="$attrs" class="flex items-center gap-2">
    <span class="shrink-0 text-xs text-(--color-text-2)">{{ label }}</span>
    <Separator decorative orientation="horizontal" class="h-px flex-1 bg-(--color-line-strong)" />
  </div>
  <Separator
    v-else
    v-bind="$attrs"
    decorative
    :orientation="vertical ? 'vertical' : 'horizontal'"
    class="bg-(--color-line-strong)"
    :class="vertical ? 'w-px self-stretch' : 'h-px w-full'" />
</template>
