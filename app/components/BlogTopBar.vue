<script setup lang="ts">
defineProps<{
  show: boolean;
  title: string;
  desc?: string;
  /** 顶栏上边距（px），由使用方传入以与触发阈值保持一致 */
  top: number;
}>();
</script>

<template>
  <Transition name="blog-top-bar">
    <div
      v-if="show"
      class="pointer-events-none fixed right-0 left-0 z-90 flex justify-center"
      :style="{ top: `${top}px` }">
      <div class="w-200 max-w-full px-4">
        <div
          class="k-surface k-glass pointer-events-auto flex w-full items-center gap-3 rounded-xl px-3 py-2">
          <NuxtLinkLocale to="/blog" class="shrink-0">
            <KIconButton icon="material-symbols:arrow-back" :label="$t('global.back')" />
          </NuxtLinkLocale>
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-base leading-tight">{{ title }}</span>
            <span v-if="desc" class="truncate text-xs leading-tight text-(--color-text-2)">{{
              desc
            }}</span>
          </div>
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.blog-top-bar-enter-active,
.blog-top-bar-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.blog-top-bar-enter-from,
.blog-top-bar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
