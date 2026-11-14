<script setup lang="ts">
import dayjs from 'dayjs';

const config = useAppConfig();
const aboutNav = useAboutNav();

// 常住城市卡片：城市配置由 KV 提供（见 /api/city），预渲染阶段拿不到，切到客户端后再取
const { data: cities } = useCity();

// 首页介绍：Markdown 源在 app/content/pages/index/<locale>.md，缺该语言版本时回退 zh-Hans。
// 单页内容构建期直接读入（不走 /api/articles —— 那套只服务文章列表/详情）。
const homeSources = import.meta.glob('../content/pages/index/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sourceFor = (lang: string) =>
  Object.entries(homeSources).find(([path]) => path.endsWith(`/${lang}.md`))?.[1];

const { locale } = useI18n();
const intro = computed(() => sourceFor(locale.value) ?? sourceFor('zh-Hans') ?? '');

// 出生天数随当前日期变化：预渲染时算出来的值会过期，切到客户端后再算
const birthDate = config.info.birth.replaceAll('-', '/');
const daysAlive = ref<number>();
onMounted(() => {
  daysAlive.value = dayjs().diff(dayjs(config.info.birth), 'day');
});
</script>

<template>
  <AppPage hero data-pagefind-body>
    <!-- Hero：半屏（不用负边距贴顶，AppPage 的边距保持不变） -->
    <div
      class="relative flex min-h-(--hero-height) flex-col items-center justify-center gap-4 text-center">
      <h1 class="font-monos text-2xl font-bold sm:text-3xl">
        <span>{{ $t('about.welcome-to') }}</span>
        <br />
        <span data-pagefind-meta="title">Kuriyona's Space</span>
      </h1>
      <KIcon
        name="material-symbols:expand-more"
        class="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-3xl text-(--color-text-4)" />
    </div>

    <!-- 关于我（左） + 右栏（常驻城市 / 出生天数 / 名字卡片）：窄屏换成两行。
         两格都默认 stretch，左卡与右栏容器取较高的那个高度；右栏里卡片不满时按比例分掉余量 -->
    <div class="grid grid-cols-1 min-lg:grid-cols-[2fr_1fr] gap-4">
      <KCard :title="$t('about.about-me')">
        <KMarkdownPage :source="intro" />
      </KCard>
      <div class="flex flex-col min-sm:max-lg:flex-row gap-4 max-sm:max-h-80">
        <CardCityMap
          v-if="cities?.resident"
          class="min-h-42 flex-1"
          :title="$t('about.city-resident')"
          :city="cities.resident" />
        <div class="flex flex-col gap-4 flex-1 max-sm:hidden">
          <KCard class="flex min-h-28 flex-col flex-1">
            <p class="text-xs text-(--color-text-3)">
              {{ $t('about.since', { date: birthDate }) }}
            </p>
            <p class="mt-auto flex items-baseline justify-end gap-1.5 pt-3">
              <span class="text-xs text-(--color-text-3)">{{ $t('about.alive-for') }}</span>
              <span class="font-monos text-2xl leading-none font-bold">{{ daysAlive ?? '—' }}</span>
              <span class="text-xs text-(--color-text-3)">{{ $t('global.unit.day') }}</span>
            </p>
          </KCard>
          <KNavCard to="/blog/about-name" class="flex-1" :title="$t('about.about-my-name')" />
        </div>
      </div>
    </div>

    <!-- 导航卡只是各页面标题/描述的聚合：正文页各自可被搜到，这里重复收录会让
         任意页面名都命中首页。与保留区导航同理排除出索引。 -->
    <div class="grid grid-cols-1 min-[900px]:grid-cols-2 gap-4" data-pagefind-ignore="all">
      <KNavCard
        v-for="item in aboutNav"
        :key="item.to"
        :to="item.to"
        :title="item.title"
        :desc="item.desc"
        :trans="item.to === '/trans'" />
    </div>
    <KNavCard
      to="/friends-and-links"
      :title="$t('friends-and-links.title')"
      :desc="$t('friends-and-links.desc')"
      data-pagefind-ignore="all" />

    <CardContact />
  </AppPage>
</template>
