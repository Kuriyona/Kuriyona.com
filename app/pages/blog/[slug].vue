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
    ? `https://r2.kuriyona.com/img/site/og/${slug}/${activeLang.value}.jpg`
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

// 文章标题与目录交给固定顶栏（见 AppBar.vue 的文章版式）；
// 文章不存在时保持顶栏原样，页面自身的 h1 会给出 not-found
const appBar = useAppBar();

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
  setupHeadingTracking();
});

// 切文章语言后正文、目录、代码块全部换新，重新绑定这些一次性副作用
watch(activeLang, async () => {
  if (!import.meta.client) return;
  await nextTick();
  window.scrollTo(0, 0);
  codeCopy.init();
  headingAnchor.init();
  setupHeadingTracking();
});

// 顶栏的目录按钮与阅读位置高亮共用这份状态（页面是异步组件，SSR 时顶栏先渲染，故顶栏侧做了水合后填充）
watchEffect(() => {
  appBar.article.value = article.value
    ? { title: article.value.title, toc: article.value.toc ?? [], active: activeSlug.value }
    : null;
});

onBeforeUnmount(() => {
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
    <h1 class="text-2xl">{{ article?.title || $t('global.not-found') }}</h1>
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
      <div v-if="article.toc?.length" class="reserve:hidden">
        <KCard :title="$t('blog.toc')">
          <BlogToc :items="article.toc" :active="activeSlug" />
        </KCard>
      </div>
      <div class="markdown-body bg-transparent!" :lang="article.lang" data-pagefind-body>
        <div v-html="article.content"></div>
      </div>
    </template>
  </AppPage>
</template>

<style lang="css">
p:has(img) {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
