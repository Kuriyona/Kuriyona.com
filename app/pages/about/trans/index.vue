<script setup lang="ts">
import dayjs from 'dayjs';
import { round } from 'es-toolkit';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAppConfig } from '#app';

const { t } = useI18n();

useSeoMeta({ title: $t('about.mtf.as-mtf') });

const BIRTH = dayjs('2008/06/28');

/**
 * 性别探索过程的里程碑。数值全由「当前时间 − 里程碑日期」推导，
 * 服务端预渲染与客户端结果一致，因此不需要 ClientOnly。
 * dateKey 非 null 表示「说不清具体日期」：只显示近似文案，也不用 <time> 语义（避免伪造精确时间）。
 */
const milestones = computed(() => {
  const now = dayjs();
  const totalLife = now.diff(BIRTH);
  const defs: {
    id: string;
    at: ReturnType<typeof dayjs>;
    dateKey: string | null;
    labelKey: string;
    unitKey: string;
    value: number;
    /** 「占生命」百分比的小数位；null = 不显示占比（出生格改显示生存天数） */
    percentDecimals: number | null;
  }[] = [
    {
      id: 'birth',
      at: BIRTH,
      dateKey: null,
      labelKey: 'about.mtf.count.birth-for',
      unitKey: 'global.unit.year',
      value: now.diff(BIRTH, 'year'),
      percentDecimals: null,
    },
    {
      id: 'want',
      at: dayjs('2020'),
      dateKey: 'about.mtf.count.want-date',
      labelKey: 'about.mtf.count.want-for',
      unitKey: 'global.unit.year',
      value: now.diff(dayjs('2020'), 'year'),
      percentDecimals: 0,
    },
    {
      id: 'identify',
      at: dayjs('2025/11/22'),
      dateKey: null,
      labelKey: 'about.mtf.count.identify-for',
      unitKey: 'global.unit.month',
      value: now.diff(dayjs('2025/11/22'), 'month'),
      percentDecimals: 2,
    },
    {
      id: 'hrt',
      at: dayjs('2026/01/14'),
      dateKey: null,
      labelKey: 'about.mtf.count.hrt-for',
      unitKey: 'global.unit.day',
      value: now.diff(dayjs('2026/01/14'), 'day') + 1,
      percentDecimals: 2,
    },
  ];

  return defs.map((def) => ({
    ...def,
    approx: def.dateKey !== null,
    label: t(def.labelKey),
    unit: t(def.unitKey),
    date: formatDate(def.at.toISOString()),
    dateText: def.dateKey ? t(def.dateKey) : formatDate(def.at.toISOString()),
    percent:
      def.percentDecimals === null
        ? null
        : round((now.diff(def.at) / totalLife) * 100, def.percentDecimals),
    note:
      def.percentDecimals === null ? `${now.diff(def.at, 'day')} ${t('global.unit.day')}` : null,
  }));
});

/** 需要补间的数值（计数 + 占比），键名与模板中的 anim 一致 */
const counters = computed(() => {
  const out: Record<string, number> = {};
  for (const milestone of milestones.value) {
    out[`v-${milestone.id}`] = milestone.value;
    if (milestone.percent !== null) out[`p-${milestone.id}`] = milestone.percent;
  }
  return out;
});

/** 显示值：SSR / 无 JS 时即最终值（HTML 里是真实数字），客户端 mount 后由 GSAP 从 0 补间 */
const anim = reactive<Record<string, number>>({});
watchEffect(() => {
  for (const [key, value] of Object.entries(counters.value)) {
    if (anim[key] === undefined) anim[key] = value;
  }
});

const valueText = (milestone: { id: string; value: number }) =>
  String(Math.round(anim[`v-${milestone.id}`] ?? milestone.value));

const percentText = (milestone: {
  id: string;
  percent: number | null;
  percentDecimals: number | null;
}) => (anim[`p-${milestone.id}`] ?? milestone.percent ?? 0).toFixed(milestone.percentDecimals ?? 0);

const barStyle = (milestone: { id: string; percent: number | null }) => ({
  width: `${Math.min(100, anim[`p-${milestone.id}`] ?? milestone.percent ?? 0)}%`,
});

/**
 * 「性别认同」条目的数据源与 /timeline 同一份 app.config.ts，按展示用的 tag 过滤。
 * 配置里是从早到晚，这里反过来（与 /timeline 一致：最新在最上）；filter 已返回新数组，可安全 reverse。
 */
const { timeline } = useAppConfig();
const genderTimeline = timeline.filter((item) => item.tag === '性别认同').reverse();

const linkGroups = computed(() => [
  {
    title: t('about.mtf.links.learn'),
    items: [
      {
        title: '跨性别 - 百度百科',
        href: 'https://baike.baidu.com/item/%E8%B7%A8%E6%80%A7%E5%88%AB',
      },
      { title: `${t('global.trans')} - Wikipedia`, href: t('urls.trans-wikipedia') },
      {
        title: `${t('global.trans')} - Bing`,
        href: `https://www.bing.com/search?q=${t('global.trans')}`,
      },
      {
        title: `${t('global.trans')} - Google`,
        href: `https://www.google.com/search?q=${t('global.trans')}`,
      },
    ],
  },
  {
    title: t('about.mtf.links.resources'),
    items: [
      { title: t('about.mtf.sites.title.gd-fyi'), href: t('urls.gd-fyi') },
      { title: 'MtF.Wiki', href: t('urls.mtf-wiki') },
      { title: '2345.lgbt', href: t('urls.2345-lgbt') },
    ],
  },
]);

/** GSAP 上下文；onUnmounted 必须在 setup 同步阶段注册（放在异步回调里会失去组件实例而失效） */
let gsapCtx: { revert: () => void } | null = null;

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  gsapCtx = mm;
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tiles = gsap.utils.toArray<HTMLElement>('.mtf-tile');
    const trigger = { trigger: tiles[0], start: 'top 92%', toggleActions: 'play none none none' };

    // 计数与占比条：滚到里程碑区时从 0 补间到最终值
    const from: Record<string, number> = {};
    for (const key of Object.keys(counters.value)) from[key] = 0;
    gsap.from(anim, { ...from, duration: 1.6, ease: 'power3.out', scrollTrigger: trigger });

    // 里程碑卡入场
    gsap.from(tiles, {
      y: 24,
      autoAlpha: 0,
      duration: 0.6,
      stagger: 0.09,
      ease: 'power2.out',
      scrollTrigger: trigger,
    });

    // 关于我卡片内容上升（加载即播放；只动 y 不动透明度，避免 SSR 值首帧闪现）
    gsap.from(gsap.utils.toArray<HTMLElement>('.mtf-intro-item'), {
      y: 18,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power2.out',
      delay: 0.1,
    });

    ScrollTrigger.refresh();
  });
});

onUnmounted(() => gsapCtx?.revert());
</script>

<template>
  <AppPage hero data-pagefind-body>
    <!-- Hero：半屏欢迎块（关于我已移出 hero，见下方独立卡片）；后间距统一交给列 gap-4，不要写 mb-* -->
    <div
      class="min-h-(--hero-height) py-4 flex flex-col items-center justify-center gap-4 text-center px-10">
      <h1 class="text-2xl font-bold font-monos">
        <span>{{ $t('about.welcome-to') }}</span>
        <br />
        <span>Kuriyona's Space</span>
        <span>&nbsp;/&nbsp;</span>
        <span class="trans-text trans-text-flow" data-pagefind-meta="title">{{
          $t('about.mtf.as-mtf')
        }}</span>
      </h1>
    </div>

    <KSurface
      class="relative overflow-hidden rounded-xl px-6 py-8 text-center sm:py-10"
      :style="{ boxShadow: 'var(--card-glow)' }">
      <div class="trans-ribbon absolute inset-x-0 top-0 h-1" aria-hidden="true"></div>
      <div class="trans-ribbon absolute inset-x-0 bottom-0 h-1" aria-hidden="true"></div>
      <div class="trans-aura absolute inset-0" aria-hidden="true"></div>
      <div class="relative flex flex-col items-center gap-4">
        <h2 class="mtf-intro-item text-lg font-bold">{{ $t('about.about-me') }}</h2>
        <p class="mtf-intro-item trans-text">{{ $t('about.mtf.im-mtf') }}</p>
        <NuxtLinkLocale
          to="/"
          class="k-interactive flex items-center gap-2 rounded-full border border-(--color-control-border) bg-(--color-control-bg) px-4 py-1.5 text-sm text-(--color-text-2) hover:text-(--color-text-1) hover:[&_.icon]:scale-100 [&_.icon]:scale-90 [&_.icon]:transition-transform [&_.icon]:duration-300">
          <span>{{ $t('about.my-site-home') }}</span>
          <KIcon name="material-symbols:arrow-forward" class="icon text-base" />
        </NuxtLinkLocale>
      </div>
    </KSurface>

    <KCard :title="$t('about.mtf.what-is-trans.title')">
      <p class="whitespace-pre-line text-sm text-(--color-text-2)">
        {{ $t('about.mtf.what-is-trans.body') }}
      </p>
    </KCard>

    <KCard :title="$t('about.mtf.journey.title')">
      <ol class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="milestone in milestones" :key="milestone.id" class="mtf-tile">
          <KSurface class="flex h-full flex-col gap-3 rounded-xl p-4">
            <div class="font-monos text-xs text-(--color-text-3)">
              <time v-if="!milestone.approx" :datetime="milestone.date">
                {{ milestone.date }}
              </time>
              <span v-else>{{ milestone.dateText }}</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-(--color-text-1)">
                {{ valueText(milestone) }}
                <span class="text-sm font-normal text-(--color-text-2)">{{ milestone.unit }}</span>
              </p>
              <p class="text-sm text-(--color-text-2)">{{ milestone.label }}</p>
            </div>
            <div class="mt-auto flex flex-col gap-1.5">
              <div
                v-if="milestone.percent !== null"
                class="h-1 w-full overflow-hidden rounded-full bg-(--color-control-bg)">
                <div
                  class="h-full rounded-full bg-(--color-theme)"
                  :style="barStyle(milestone)"></div>
              </div>
              <div v-else class="h-1" aria-hidden="true"></div>
              <p class="text-xs text-(--color-text-3)">
                {{ milestone.note ?? $t('about.mtf.percent-life', [percentText(milestone)]) }}
              </p>
            </div>
          </KSurface>
        </li>
      </ol>
    </KCard>

    <KCard :title="$t('about.mtf.timeline.title')">
      <div
        class="-mx-4 max-h-80 overflow-y-auto overscroll-contain px-4"
        tabindex="0"
        role="region"
        :aria-label="$t('about.mtf.timeline.title')">
        <TimelineList :items="genderTimeline" />
      </div>
    </KCard>

    <KCard :title="$t('about.mtf.about-trans')">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-(--color-text-2)">{{ $t('about.mtf.slogan') }}</p>
        <template v-for="(group, index) in linkGroups" :key="group.title">
          <KDivider v-if="index > 0" />
          <div>
            <p class="mb-3 font-monos text-xs text-(--color-text-3)">{{ group.title }}</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <KCardLink
                v-for="item in group.items"
                :key="item.href"
                :to="item.href"
                :text="item.title"
                :new="true" />
            </div>
          </div>
        </template>
      </div>
    </KCard>
  </AppPage>
</template>
