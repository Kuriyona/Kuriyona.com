<script setup lang="ts">
import 'github-markdown-css/github-markdown-dark.css';
import type { ArticleMeta } from '~~/server/utils';

const route = useRoute();
const router = useRouter();

const slug = route.params.slug;
const { locale, locales } = useI18n();
const localePath = useLocalePath();

const codeCopy = useCodeCopy();
const headingAnchor = useHeadingAnchor();

const { data: articlesData } = await useFetch(`/api/articles/${slug}`);
const variants = computed(() => (articlesData.value as ArticleMeta[]) ?? []);
const findVariant = (lang: string) =>
  lang ? variants.value.find((post) => post.lang.toLowerCase() === lang.toLowerCase()) : undefined;
// ?lang 决定正文语言，站点 UI 语言（locale）保持不变
const activeLang = computed(() => {
  const queryLang = typeof route.query.lang === 'string' ? route.query.lang : '';
  return (findVariant(queryLang) ?? findVariant(locale.value) ?? variants.value[0])?.lang ?? '';
});
const article = computed(() => findVariant(activeLang.value));
const languageOptions = computed(() =>
  locales.value.flatMap((item) => {
    const variant = findVariant(item.code);
    return variant ? [{ value: variant.lang, label: item.name ?? item.code }] : [];
  }),
);
const canonicalUrl = computed(() =>
  activeLang.value
    ? `https://kuriyona.com${localePath(`/blog/${slug}`, activeLang.value)}`
    : undefined,
);

function selectLang(lang: string) {
  if (lang === activeLang.value) return;
  const query = { ...route.query };
  // 回到站点当前语言时不保留多余的 ?lang
  if (lang.toLowerCase() === locale.value.toLowerCase()) delete query.lang;
  else query.lang = lang;
  router.push({ query });
}

const seoTitle = computed(() => article.value?.title || $t('global.not-found'));
const seoDescription = computed(() => article.value?.desc as string);
const seoOgImage = computed(() =>
  activeLang.value
    ? `https://r2.kuriyona.com/img/site/og/${slug}/${activeLang.value}.png`
    : undefined,
);

useSeoMeta({
  title: computed(() => `${seoTitle.value}  - ${$t('blog.title')}`),
  description: seoDescription,
  ogUrl: canonicalUrl,
});
useSeoMeta({
  ogImage: seoOgImage,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  // X 缺 twitter:* 时会回退 og:*，这里显式对齐（og:url / twitter:card 沿用 app.vue 的站点级设置）
  twitterImage: seoOgImage,
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
});
// ?lang 只改变正文语言，canonical 始终指向该文章语言版本的正式路由
useHead({
  link: computed(() =>
    canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : [],
  ),
});

// 标题 / 目录滚出顶栏可视区（含被固定菜单栏与浮动顶栏遮住的部分）后分别显示浮动顶栏与浮动目录
// 浮动元素上边距：菜单栏底边（64px 内容 + 2px 描边）+ 6px 留白
const floatingTop = 72;
const titleEl = useTemplateRef<HTMLElement>('titleEl');
const tocEl = useTemplateRef<HTMLElement>('tocEl');
const tocMenuEl = useTemplateRef<HTMLElement>('tocMenuEl');
const showTopBar = ref(false);
const showFloatingToc = ref(false);
const tocOpen = ref(false);
let titleObserver: IntersectionObserver | undefined;
let tocObserver: IntersectionObserver | undefined;

function onPointerdown(e: PointerEvent) {
  if (!tocMenuEl.value?.contains(e.target as Node)) tocOpen.value = false;
}

// 阅读位置高亮：以 html 的 scroll-padding-top 为阅读线（点击锚点后标题正好停在该线上），
// 取最后一个顶边越过阅读线的标题
const activeSlug = ref('');
let headingEls: HTMLElement[] = [];
let ticking = false;

function updateActiveHeading() {
  ticking = false;
  const line = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  let current = '';
  for (const el of headingEls) {
    if (el.getBoundingClientRect().top > line) break;
    current = el.id;
  }
  activeSlug.value = current;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(updateActiveHeading);
}

function observeLayout() {
  titleObserver?.disconnect();
  tocObserver?.disconnect();
  if (titleEl.value) titleObserver?.observe(titleEl.value);
  if (tocEl.value) tocObserver?.observe(tocEl.value);
  else showFloatingToc.value = false;
}

function setupHeadingTracking() {
  document.removeEventListener('scroll', onScroll);
  headingEls = (article.value?.toc ?? [])
    .map((item) => document.getElementById(item.slug))
    .filter((el): el is HTMLElement => el !== null);
  if (headingEls.length) {
    document.addEventListener('scroll', onScroll, { passive: true });
    updateActiveHeading();
  } else {
    activeSlug.value = '';
  }
}

onMounted(() => {
  const rootMargin = `-${floatingTop}px 0px 0px 0px`;
  titleObserver = new IntersectionObserver(
    ([entry]) => (showTopBar.value = !entry.isIntersecting),
    { rootMargin },
  );
  tocObserver = new IntersectionObserver(
    ([entry]) => (showFloatingToc.value = !entry.isIntersecting),
    { rootMargin },
  );
  observeLayout();
  document.addEventListener('pointerdown', onPointerdown);
  setupHeadingTracking();
});

// 切文章语言后正文、目录、代码块全部换新，重新绑定这些一次性副作用
watch(activeLang, async () => {
  if (!import.meta.client) return;
  await nextTick();
  window.scrollTo(0, 0);
  codeCopy.init();
  headingAnchor.init();
  observeLayout();
  setupHeadingTracking();
});

// 浮动目录按钮只在目录滚出视口期间存在，滚回时收起展开的面板
watch(showFloatingToc, (visible) => {
  if (!visible) tocOpen.value = false;
});

onBeforeUnmount(() => {
  titleObserver?.disconnect();
  tocObserver?.disconnect();
  document.removeEventListener('pointerdown', onPointerdown);
  document.removeEventListener('scroll', onScroll);
});
</script>

<template>
  <AppPage>
    <!-- 宽屏：目录常驻左侧保留区（窄屏用正文顶部的内联目录卡片） -->
    <template #reserve-left>
      <KCard v-if="article?.toc?.length" :title="$t('blog.toc')">
        <BlogToc :items="article.toc" :active="activeSlug" />
      </KCard>
    </template>
    <NuxtLinkLocale to="/blog">
      <KIconButton icon="material-symbols:arrow-back" />
    </NuxtLinkLocale>
    <h1 ref="titleEl" class="text-2xl">{{ article?.title || $t('global.not-found') }}</h1>
    <p class="text-sm">{{ article?.desc || $t('blog.not-found') }}</p>
    <template v-if="!article">
      <KDivider />
      <KCardLink to="/blog" :text="$t('blog.title')" icon="material-symbols:arrow-back" />
    </template>
    <template v-else>
      <div class="flex justify-between items-center gap-2 flex-wrap">
        <span class="flex items-center gap-1">
          <KIcon name="material-symbols:schedule" class="text-sm" />
          <span class="text-sm">{{
            $t('blog.reading-time', [
              Math.ceil(article.readingTime.minutes),
              article.readingTime.words,
            ])
          }}</span>
        </span>
        <div class="flex justify-between items-center gap-2 flex-wrap">
          <span class="flex items-center gap-1">
            <KIcon name="material-symbols:event" class="text-sm" />
            <span class="text-sm"> {{ formatDate(article.date) }}</span>
          </span>
          <span class="flex items-center gap-1">
            <KIcon name="material-symbols:edit" class="text-sm" />
            <span class="text-sm"> {{ formatDate(article.edit) }}</span>
          </span>
        </div>
      </div>
      <div v-if="languageOptions.length > 1" class="flex flex-wrap items-center gap-2">
        <KIcon name="material-symbols:translate" class="shrink-0 text-sm" />
        <div
          class="flex flex-wrap items-center gap-1 rounded-md border border-(--color-control-border) bg-(--color-control-bg) p-1"
          role="group"
          :aria-label="$t('blog.article-language')">
          <button
            v-for="option in languageOptions"
            :key="option.value"
            type="button"
            class="k-interactive rounded px-2 py-1 text-xs transition-colors"
            :class="
              option.value === activeLang
                ? 'bg-[var(--color-theme)]/20 text-(--color-theme)'
                : 'text-(--color-text-2) hover:text-(--color-text-1)'
            "
            :aria-pressed="option.value === activeLang"
            @click="selectLang(option.value)">
            {{ option.label }}
          </button>
        </div>
        <span class="text-xs text-(--color-text-2)">{{ $t('blog.article-language-only') }}</span>
      </div>
      <div
        v-if="article.aiGenerated || article.aiTranslated"
        class="flex flex-wrap items-center gap-2">
        <KBadge v-if="article.aiGenerated">{{ $t('blog.ai-generated') }}</KBadge>
        <KBadge v-if="article.aiReview">{{
          $t('blog.ai-reviewed', [$t(AI_REVIEW_KEYS[article.aiReview])])
        }}</KBadge>
        <KBadge v-if="article.aiTranslated">{{ $t('blog.ai-translated') }}</KBadge>
      </div>
      <KDivider />
      <div v-if="article.toc?.length" ref="tocEl" class="reserve:hidden">
        <KCard :title="$t('blog.toc')">
          <BlogToc :items="article.toc" :active="activeSlug" />
        </KCard>
      </div>
      <div class="markdown-body bg-transparent!" data-pagefind-body>
        <div v-html="article.content"></div>
      </div>
    </template>
    <BlogTopBar
      :show="showTopBar"
      :title="article?.title || $t('global.not-found')"
      :desc="article?.desc"
      :top="floatingTop">
      <!-- 窄屏：浮动顶栏右侧的目录按钮 + 展开的悬浮目录（右对齐按钮，下留边距） -->
      <template #actions>
        <div
          v-if="showFloatingToc && article?.toc?.length"
          ref="tocMenuEl"
          class="relative shrink-0 reserve:hidden">
          <KIconButton
            icon="material-symbols:toc"
            :label="$t('blog.toc')"
            @click="tocOpen = !tocOpen" />
          <Transition name="toc-float">
            <KSurface
              v-if="tocOpen"
              level="3"
              class="absolute top-full right-0 z-10 mt-2 max-h-[60vh] w-64 overflow-y-auto rounded-xl p-3">
              <h2 class="mb-2 text-sm font-bold">{{ $t('blog.toc') }}</h2>
              <BlogToc :items="article.toc" :active="activeSlug" @navigate="tocOpen = false" />
            </KSurface>
          </Transition>
        </div>
      </template>
    </BlogTopBar>
  </AppPage>
</template>

<style lang="css">
p:has(img) {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<style scoped>
.toc-float-enter-active,
.toc-float-leave-active {
  transition: opacity 0.25s ease;
}

.toc-float-enter-from,
.toc-float-leave-to {
  opacity: 0;
}
</style>
