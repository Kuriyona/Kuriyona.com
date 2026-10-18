<script setup lang="ts">
import 'github-markdown-css/github-markdown-dark.css';
import type { ArticleMeta } from '~~/server/utils';

const route = useRoute();

const slug = route.params.slug;
const { locale } = useI18n();

useCodeCopy();
useHeadingAnchor();

const { data: articlesData } = await useFetch(`/api/articles/${slug}`);
const article = computed(() =>
  (articlesData.value as ArticleMeta[]).find(
    (post) => post.lang.toLowerCase() == locale.value.toLowerCase(),
  ),
);
const otherLangs = computed(() =>
  (articlesData.value as ArticleMeta[]).filter(
    (post) => post.lang.toLowerCase() != locale.value.toLowerCase(),
  ),
);

const seoTitle = computed(() => article.value?.title || $t('global.not-found'));
const seoDescription = computed(() => article.value?.desc as string);
const seoOgImage = computed(
  () => `https://r2.kuriyona.com/img/site/og/${slug}/${locale.value}.png`,
);

useSeoMeta({
  title: computed(() => `${seoTitle.value}  - ${$t('blog.title')}`),
  description: seoDescription,
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
  if (titleEl.value) titleObserver.observe(titleEl.value);
  if (tocEl.value) tocObserver.observe(tocEl.value);
  document.addEventListener('pointerdown', onPointerdown);

  headingEls = (article.value?.toc ?? [])
    .map((item) => document.getElementById(item.slug))
    .filter((el): el is HTMLElement => el !== null);
  if (headingEls.length) {
    document.addEventListener('scroll', onScroll, { passive: true });
    updateActiveHeading();
  }
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
      <div v-if="article.aiGenerated" class="flex flex-wrap items-center gap-2">
        <KBadge>{{ $t('blog.ai-generated') }}</KBadge>
        <KBadge v-if="article.aiReview">{{
          $t('blog.ai-reviewed', [$t(AI_REVIEW_KEYS[article.aiReview])])
        }}</KBadge>
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
    <template v-if="otherLangs?.length">
      <KDivider />
      <KCard :title="$t('blog.other-lang')">
        <div class="flex flex-col gap-2">
          <KCardLink
            v-for="lang in otherLangs"
            :key="lang.lang"
            :locale="lang.lang"
            :to="`/blog/${lang.slug}`">
            <span class="block truncate text-base leading-tight">{{ lang.title }}</span>
            <span
              v-if="lang.desc"
              class="block truncate text-xs leading-tight text-(--color-text-2)"
              >{{ lang.desc }}</span
            >
          </KCardLink>
        </div>
      </KCard>
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
