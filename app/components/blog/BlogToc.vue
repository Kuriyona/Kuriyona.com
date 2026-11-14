<script setup lang="ts">
import type { TocItem } from '~~/server/utils';

defineProps<{
  items: TocItem[];
  /** 当前阅读位置的标题 slug */
  active?: string;
}>();

const emit = defineEmits<{ navigate: [] }>();
</script>

<template>
  <ul class="flex flex-col">
    <li v-for="item in items" :key="item.slug">
      <a
        :href="`#${item.slug}`"
        :title="item.text"
        :aria-current="item.slug === active ? 'location' : undefined"
        :style="{ paddingLeft: `${(item.level - 2) * 14 + 8}px` }"
        class="k-interactive block truncate rounded-md py-1 pr-2"
        :class="
          item.slug === active
            ? 'bg-(--color-hover) font-medium text-(--color-text-1)'
            : 'text-(--color-text-2) hover:text-(--color-text-1)'
        "
        @click="emit('navigate')">
        {{ item.text }}
      </a>
    </li>
  </ul>
</template>
