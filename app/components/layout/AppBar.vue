<script setup lang="ts">
import { adminNav } from '~/data/adminNav';
import { useSearch } from '~/composables/useSearch';
const menuOpen = ref(false);
/** 顶栏复合音乐按钮打开的悬浮面板（≥768 的唯一音乐入口；<768 不提供音乐入口） */
const musicOpen = ref(false);

// 顶栏左侧只渲染面包屑：站名 / 一级 / 二级…（页面正文里不放返回按钮，见 AGENTS.md）。
// 层级来自路径段（去掉语言前缀），每级文案按 `<各段以 . 连接>.title` 查 i18n：
// `/blog` → `blog.title`、`/ask-box/ask` → `ask-box.ask.title`。
// 文章详情页末级用文章标题（页面异步写进 useAppBar）；查不到的路径（404）只显示站名。
const route = useRoute();
const { t, te } = useI18n();
const localePath = useLocalePath();
const { article } = useAppBar();
const isArticleRoute = computed(() => String(route.name ?? '').startsWith('blog-slug'));

/** 去掉语言前缀后的路径段（`prefix_except_default`：默认语言无前缀，其余是 `/en/...`） */
const segments = computed(() => {
  const home = localePath('/');
  const rest =
    home !== '/' && route.path.startsWith(home) ? route.path.slice(home.length) : route.path;
  return rest.split('/').filter(Boolean);
});

interface Crumb {
  to: string;
  label: string;
}

const crumbs = computed<Crumb[]>(() =>
  segments.value.flatMap((_, index) => {
    const segs = segments.value.slice(0, index + 1);
    const path = `/${segs.join('/')}`;
    const isLast = index === segments.value.length - 1;
    const key = `${segs.join('.')}.title`;
    // 文章标题来自异步数据（SSR 拿不到），先用不换行空格占位避免布局跳动；其余页面按路径约定查 i18n
    const label =
      isLast && isArticleRoute.value ? article.value?.title || '\u00A0' : te(key) ? t(key) : '';
    // 管理端没有 i18n key，文案与侧栏共用 adminNav；仍查不到就整级跳过
    const text = label || adminNav.find((item) => item.to === path)?.label || '';
    return text ? [{ to: path, label: text }] : [];
  }),
);
/** 面包屑行只放祖先级，末级（当前页）单独作为大字标题 */
const ancestors = computed(() => crumbs.value.slice(0, -1));
const currentCrumb = computed(() => crumbs.value.at(-1));
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
        <!-- 左侧：非首页「面包屑（祖先级） + 大字标题」两行；首页只显示站名 -->
        <div v-if="currentCrumb" class="flex min-w-0 flex-1 flex-col justify-center">
          <nav
            class="flex min-w-0 items-center gap-1.5 text-xs leading-tight text-(--color-text-2)"
            :aria-label="$t('global.breadcrumb')">
            <NuxtLinkLocale to="/" class="shrink-0 hover:text-(--color-text-1) hover:underline">
              Kuriyona's Space
            </NuxtLinkLocale>
            <template v-for="crumb in ancestors" :key="crumb.to">
              <span class="shrink-0 text-(--color-text-3)" aria-hidden="true">/</span>
              <NuxtLinkLocale
                :to="crumb.to"
                class="shrink-0 hover:text-(--color-text-1) hover:underline">
                {{ crumb.label }}
              </NuxtLinkLocale>
            </template>
          </nav>
          <span class="truncate text-lg leading-tight font-bold">{{ currentCrumb.label }}</span>
        </div>
        <NuxtLinkLocale v-else to="/">
          <span class="hover:underline">Kuriyona's Space</span>
        </NuxtLinkLocale>
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
          <!-- 搜索在 <md 收进 AppMenu（同一个「更多」按钮），见 AppMenu.vue 的 narrow 区块；
               音乐 <md 不提供入口（设计如此），只剩本胶囊这一条路。
               插槽/页面级按钮（文章目录）不合并，窄屏照旧单独显示。 -->
          <KIconButton
            icon="material-symbols:search"
            class="max-md:hidden"
            @click="search.toggle()" />
          <!-- 复合音乐按钮：整体是一个胶囊，右端嵌一个更小的播放/暂停子按钮。
               点胶囊其他区域（含左端乐符）= 打开悬浮音乐面板；点子按钮 = 播放/暂停。
               ≥768 一直显示（保留区不再放播放器，这里是 <768 以上唯一音乐入口）；<768 直接隐藏（max-md:hidden）。
               h-9（36px，border-box）= 两侧 KButton 的高度（p-2 + text-lg 图标 18px + 边框），
               不写死的话内容高度（size-6 子按钮 24px）撑出来只有 30px，会比左右两个按钮矮一截。
               pr-1.25（5px）= 内高 34 − 子按钮 24 = 上下各 5px，加边框后四周到子按钮都是 6px
               （左侧还有 gap-1.5 = 6px），子按钮才是正中的，不然右边只有 3px 会显偏。 -->
          <div
            class="k-interactive relative flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-(--color-control-border) bg-(--color-control-bg) pr-1.25 pl-2.5 text-(--color-text-1) max-md:hidden">
            <!-- 铺满整块的点击层（同时也是键盘入口）；子按钮叠在它上面，点到子按钮不会穿透到这里 -->
            <button
              type="button"
              class="absolute inset-0 rounded-full"
              :aria-label="$t('music.open-panel')"
              @click="musicOpen = true" />
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
          <KButton round :aria-label="$t('global.more')" @click="menuOpen = true">
            <KIcon name="material-symbols:menu" class="text-lg" />
          </KButton>
        </div>
      </div>
    </div>
  </div>
  <AppMenu v-model="menuOpen" />
  <MusicPanel v-model="musicOpen" />
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
