<script setup lang="ts">
interface Chip {
  text: string;
  icon?: string;
}

const props = withDefaults(
  defineProps<{
    /** 块内文本（由 KMarkdownPage 传入）：一行一个 chip */
    content?: string;
    /** solid：主题色胶囊；outline：描边胶囊 */
    variant?: 'solid' | 'outline';
    /** 所有 chip 共用的图标；某行行首写了图标全名时以行内为准 */
    icon?: string;
  }>(),
  { content: '', variant: 'solid', icon: '' },
);

// 行首完整图标名（如 `material-symbols:cake 2008-06-28`）单独拆出来，其余是 chip 文本
const ICON_PREFIX = /^((?:material-symbols|simple-icons):[a-z0-9-]+)\s+(.+)$/;

const chips = computed<Chip[]>(() =>
  props.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const match = line.match(ICON_PREFIX);
      return match
        ? { icon: match[1], text: match[2] }
        : { icon: props.icon || undefined, text: line };
    }),
);
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="chip in chips"
      :key="chip.text"
      class="inline-flex items-center gap-1.5 px-3 py-1 text-xs"
      :class="
        props.variant === 'outline'
          ? 'rounded-full border border-(--color-line-strong) text-(--color-text-2)'
          : 'rounded-lg bg-[var(--color-theme)]/20 text-[var(--color-theme)]'
      ">
      <KIcon v-if="chip.icon" :name="chip.icon" class="text-sm" />
      <span>{{ chip.text }}</span>
    </span>
  </div>
</template>
