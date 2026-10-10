<script setup lang="ts">
import { Separator } from 'reka-ui';

withDefaults(
  defineProps<{
    vertical?: boolean;
  }>(),
  { vertical: false },
);
</script>

<template>
  <Separator
    decorative
    :orientation="vertical ? 'vertical' : 'horizontal'"
    class="bg-white/10"
    :class="vertical ? 'w-px self-stretch' : 'h-px w-full'" />
</template>
