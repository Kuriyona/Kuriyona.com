<script setup lang="ts">
// `hero`：页面首个块是半屏 hero（高 --hero-height）时打开。
// 右栏据此整体下移到 hero 底部之后一个列间距——不动 sticky，只改它在流里的起点：
// hero 在屏时小组件跟在 hero 下方并与下一块内容齐平，滚过之后照常在顶栏下吸顶，无需滚动监听。
defineProps<{ hero?: boolean }>();
</script>

<template>
  <div class="flex justify-center min-h-[calc(100vh)-var(--app-bar-height)] mt-(--app-bar-height)">
    <!-- 两侧保留区：视口够宽（reserve: 断点）才出现的独立栏位，内容由命名插槽填充。
         右侧即使没内容也保留同等宽度，正文列才始终居中。 -->
    <aside class="reserve hidden reserve:block pr-4">
      <slot name="reserve-left" />
    </aside>
    <div class="w-(--content-width) max-w-full my-20 p-4 flex flex-col gap-4">
      <slot />
    </div>
    <aside
      class="reserve hidden reserve:block pl-4"
      :class="hero ? 'mt-(--reserve-hero-offset)' : ''">
      <div class="flex flex-col gap-4">
        <!-- 默认小组件（时钟 / 站点导航 / 当前语言最近文章），页面可用 reserve-right 追加内容 -->
        <ReserveClock />
        <ReserveNav />
        <ReserveArticles />
        <slot name="reserve-right" />
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* 保留区：贴住顶栏的固定栏位（sticky，所以不随页面滚动）。
   高度 = 视口高度 - 菜单栏高度，内容超长时在栏内滚动。
   padding-top 与正文列首个子元素的起点对齐（正文列 my-20 + p-4 = 6rem），
   这样栏内卡片与正文首卡齐平，hero 页配合 mt-(--hero-height) 也正好落在 hero 底部。 */
.reserve {
  flex: none;
  position: sticky;
  top: var(--app-bar-height);
  align-self: flex-start;
  width: var(--reserve-width);
  height: calc(100dvh - var(--app-bar-height));
  overflow-y: auto;
  padding-top: 6rem;
}
</style>
