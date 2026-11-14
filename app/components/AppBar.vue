<script setup lang="ts">
import AppMenu from './AppBar/AppMenu.vue';
import KButton from './KButton.vue';
import { useSearch } from '~/composables/useSearch';
const mobileMenu = ref(false);
/** 窄视口的悬浮音乐面板（宽视口用左保留区的播放器，见模板里的 reserve:hidden） */
const musicPanel = ref(false);

// 文章详情页：固定顶栏换成「返回 + 面包屑 + 标题」。
// 版式按路由名同步判定，SSR 就直接渲染正确结构；标题由页面写进 useAppBar，
// 而页面是异步组件（await 文章数据），SSR 时顶栏先渲染拿不到标题 ——
// 所以标题等水合后再填，否则服务端（无标题）与客户端（有标题）结构不一致会报水合错误。
const route = useRoute();
const { article } = useAppBar();
const isArticleRoute = computed(() => String(route.name ?? '').startsWith('blog-slug'));
const hydrated = ref(false);
// 顶栏目录按钮（窄屏；宽屏的目录在左侧保留区）与展开的面板
const tocOpen = ref(false);
const tocMenuEl = useTemplateRef<HTMLElement>('tocMenuEl');

function onPointerdown(e: PointerEvent) {
  if (!tocMenuEl.value?.contains(e.target as Node)) tocOpen.value = false;
}

// 换文章 / 离开文章页时收起面板
watch(
  () => route.fullPath,
  () => (tocOpen.value = false),
);

const search = useSearch();
const { current, playing, toggle } = useMusic();

onMounted(() => {
  hydrated.value = true;
  function globalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      search.toggle();
    }
  }
  document.addEventListener('keydown', globalKeydown);
  document.addEventListener('pointerdown', onPointerdown);
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', globalKeydown);
    document.removeEventListener('pointerdown', onPointerdown);
  });
});
</script>

<template>
  <div class="k-surface k-glass-bar fixed w-screen top-0 z-100 flex justify-center">
    <div class="w-(--content-width) max-w-screen px-4 *:px-2 *:font-monos">
      <div class="relative min-h-12 py-2 px-3 flex justify-between items-center gap-3 rounded-xl">
        <!-- 文章详情页：不显示头像与站名，最左侧返回按钮，右侧两级 (面包屑 / 标题) -->
        <template v-if="isArticleRoute">
          <NuxtLinkLocale to="/blog" class="shrink-0">
            <KIconButton icon="material-symbols:arrow-back" :label="$t('global.back')" />
          </NuxtLinkLocale>
          <div class="flex min-w-0 flex-1 flex-col justify-center">
            <span class="truncate text-xs leading-tight text-(--color-text-2)">
              Kuriyona's Space / {{ $t('blog.crumb') }}
            </span>
            <span class="truncate text-lg leading-tight font-bold">{{
              hydrated && article?.title ? article.title : '\u00A0'
            }}</span>
          </div>
        </template>
        <div v-else class="h-full flex items-center gap-4">
          <img
            class="h-6 rounded-md hidden sm:inline-block"
            src="https://r2.kuriyona.com/img/avatar/Avatar_256.png" />
          <NuxtLinkLocale to="/">
            <span class="hover:underline">Kuriyona's Space</span>
          </NuxtLinkLocale>
        </div>
        <div id="actions" class="flex items-center gap-2">
          <!-- 文章页：目录按钮（窄屏才出现，宽屏目录在左侧保留区），与右侧操作组用竖线分隔 -->
          <template v-if="hydrated && isArticleRoute && article?.toc?.length">
            <div ref="tocMenuEl" class="relative reserve:hidden">
              <KIconButton
                icon="material-symbols:toc"
                :label="$t('blog.toc')"
                @click="tocOpen = !tocOpen" />
              <Transition name="toc-panel">
                <KSurface
                  v-if="tocOpen"
                  level="3"
                  class="absolute top-full right-0 z-10 mt-2 max-h-[60vh] w-64 overflow-y-auto rounded-xl p-3">
                  <h2 class="mb-2 text-sm font-bold">{{ $t('blog.toc') }}</h2>
                  <BlogToc
                    :items="article.toc"
                    :active="article.active"
                    @navigate="tocOpen = false" />
                </KSurface>
              </Transition>
            </div>
            <KDivider vertical class="reserve:hidden" />
          </template>
          <!-- 搜索 / 音乐在 <md 收进 AppMenu（同一个「更多」按钮），见 AppMenu.vue 的 narrow 区块。
               插槽/页面级按钮（文章目录）不合并，窄屏照旧单独显示。 -->
          <KIconButton
            icon="material-symbols:search"
            class="max-md:hidden"
            @click="search.toggle()" />
          <!-- 复合音乐按钮：整体是一个胶囊，右端嵌一个更小的播放/暂停子按钮。
               点胶囊其他区域（含左端乐符）= 打开悬浮音乐面板；点子按钮 = 播放/暂停。
               只在 768px～reserve 断点之间出现：更宽时左保留区有完整播放器卡片（reserve:hidden），
               <md 时并入 AppMenu 抽屉（max-md:hidden），不占顶栏。
               h-9（36px，border-box）= 两侧 KButton 的高度（p-2 + text-lg 图标 18px + 边框），
               不写死的话内容高度（size-6 子按钮 24px）撑出来只有 30px，会比左右两个按钮矮一截。
               pr-1.25（5px）= 内高 34 − 子按钮 24 = 上下各 5px，加边框后四周到子按钮都是 6px
               （左侧还有 gap-1.5 = 6px），子按钮才是正中的，不然右边只有 3px 会显偏。 -->
          <div
            class="k-interactive relative flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-(--color-control-border) bg-(--color-control-bg) pr-1.25 pl-2.5 text-(--color-text-1) max-md:hidden reserve:hidden">
            <!-- 铺满整块的点击层（同时也是键盘入口）；子按钮叠在它上面，点到子按钮不会穿透到这里 -->
            <button
              type="button"
              class="absolute inset-0 rounded-full"
              :aria-label="$t('music.open-panel')"
              @click="musicPanel = true" />
            <KIcon name="material-symbols:music-note" class="pointer-events-none text-lg" />
            <button
              type="button"
              class="relative grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-theme)]/20 text-(--color-theme) disabled:opacity-50"
              :aria-label="playing ? $t('music.pause') : $t('music.play')"
              :disabled="!current"
              @click="toggle">
              <KIcon
                :name="playing ? 'material-symbols:pause' : 'material-symbols:play-arrow'"
                class="text-base" />
            </button>
          </div>
          <!-- 「更多」按钮只画菜单图标：语言切换在抽屉里（进抽屉后再选），不在按钮上预告 -->
          <KButton round :aria-label="$t('global.more')" @click="mobileMenu = true">
            <KIcon name="material-symbols:menu" class="text-lg" />
          </KButton>
        </div>
      </div>
    </div>
  </div>
  <AppMenu v-model="mobileMenu" />
  <MusicPanel v-model="musicPanel" />
  <SearchModal />
</template>

<style scoped>
.toc-panel-enter-active,
.toc-panel-leave-active {
  transition: opacity 0.25s ease;
}

.toc-panel-enter-from,
.toc-panel-leave-to {
  opacity: 0;
}
</style>
