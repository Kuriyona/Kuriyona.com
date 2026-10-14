<template>
  <div class="flex justify-center min-h-[calc(100vh)-var(--app-bar-height)] mt-(--app-bar-height)">
    <!-- 两侧保留区：视口够宽（reserve: 断点）才出现的独立栏位，内容由命名插槽填充。
         右侧即使没内容也保留同等宽度，正文列才始终居中。 -->
    <aside class="reserve hidden reserve:block pr-4">
      <slot name="reserve-left" />
    </aside>
    <div class="w-(--content-width) max-w-full my-20 p-4 flex flex-col gap-4">
      <slot />
      <div class="flex-1"></div>
      <AppFooter />
    </div>
    <aside class="reserve hidden reserve:block pl-4">
      <slot name="reserve-right" />
    </aside>
  </div>
</template>

<style scoped>
/* 保留区：贴住顶栏的固定栏位（sticky，所以不随页面滚动）。
   高度 = 视口高度 - 菜单栏高度，内容超长时在栏内滚动。
   padding-top 与正文列的 my-20 对齐，让栏内卡片与正文首卡齐平。 */
.reserve {
  flex: none;
  position: sticky;
  top: var(--app-bar-height);
  align-self: flex-start;
  width: var(--reserve-width);
  height: calc(100dvh - var(--app-bar-height));
  overflow-y: auto;
  padding-top: 5rem;
}
</style>
