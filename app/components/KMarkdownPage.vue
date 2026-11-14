<script setup lang="ts">
import type { Component } from 'vue';
import KChips from '~/components/KChips.vue';

const props = defineProps<{
  /** Markdown 源文本（页面用 `?raw` 直接 import） */
  source: string;
}>();

/** Markdown 里可用的块级组件：标签名 → 组件。组件用 `content` prop 接收块内文本。 */
const COMPONENTS: Record<string, Component> = {
  Chips: KChips,
};

const localePath = useLocalePath();

const blocks = computed(() => {
  const parsed = parseMarkdownPage(props.source, { resolveLink: (href) => localePath(href) });
  if (import.meta.dev) {
    for (const block of parsed) {
      if (block.type === 'component' && !(block.name in COMPONENTS)) {
        console.warn(`[KMarkdownPage] 未注册的 Markdown 组件：<${block.name}>`);
      }
    }
  }
  return parsed;
});
</script>

<template>
  <div class="md-page flex flex-col gap-4">
    <template v-for="(block, index) in blocks" :key="index">
      <div v-if="block.type === 'html'" v-html="block.html"></div>
      <component
        :is="COMPONENTS[block.name]"
        v-else-if="COMPONENTS[block.name]"
        v-bind="block.attrs"
        :content="block.content" />
    </template>
  </div>
</template>

<style scoped>
/* 页面 Markdown 的版式：只覆盖标签默认样式，颜色 / 层级一律走令牌。
   标题与正文写在同一个 HTML 块里，所以垂直间距在这里给；块与块之间的间距由根节点 gap 负责。 */
.md-page :deep(h1),
.md-page :deep(h2),
.md-page :deep(h3) {
  color: var(--color-text-1);
  font-weight: 700;
}

.md-page :deep(h1),
.md-page :deep(h2) {
  font-size: 1.0625rem;
  margin: 1.5rem 0 0.5rem;
}

.md-page :deep(h3) {
  font-size: 1rem;
  margin: 1.25rem 0 0.5rem;
}

.md-page :deep(h1:first-child),
.md-page :deep(h2:first-child),
.md-page :deep(h3:first-child) {
  margin-top: 0;
}

.md-page :deep(p) {
  margin: 0;
}

.md-page :deep(p + p),
.md-page :deep(ul + p),
.md-page :deep(ol + p),
.md-page :deep(p + ul),
.md-page :deep(p + ol) {
  margin-top: 0.75rem;
}

.md-page :deep(ul),
.md-page :deep(ol) {
  padding-left: 1.25rem;
}

.md-page :deep(ul) {
  list-style: disc;
}

.md-page :deep(ol) {
  list-style: decimal;
}

.md-page :deep(li + li) {
  margin-top: 0.25rem;
}

.md-page :deep(hr) {
  border: 0;
  border-top: 1px solid var(--color-line-strong);
  margin: 1.25rem 0;
}

.md-page :deep(strong) {
  color: var(--color-text-1);
  font-weight: 700;
}

.md-page :deep(code) {
  background-color: var(--color-control-bg);
  border-radius: 0.25rem;
  font-family: var(--font-family-monos);
  font-size: 0.875em;
  padding: 0.1em 0.35em;
}

.md-page :deep(pre) {
  background-color: var(--color-surface-inset);
  border: 1px solid var(--color-line);
  border-radius: 0.5rem;
  overflow-x: auto;
  padding: 0.75rem;
}

.md-page :deep(pre code) {
  background: none;
  padding: 0;
}

.md-page :deep(blockquote) {
  border-left: 2px solid var(--color-line-strong);
  color: var(--color-text-2);
  padding-left: 0.75rem;
}

.md-page :deep(img) {
  border-radius: 0.5rem;
  max-width: 100%;
}
</style>
