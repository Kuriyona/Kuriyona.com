<script setup lang="ts">
import dayjs from 'dayjs';
import { round } from 'es-toolkit';

const { t } = useI18n();

const isJune = computed(() => dayjs().month() == 5);

const data = computed(() => [
  {
    title: '跨性别 - 百度百科',
    href: 'https://baike.baidu.com/item/%E8%B7%A8%E6%80%A7%E5%88%AB',
  },
  {
    title: `${t('trans')} - Wikipedia`,
    href: t('urls.trans_wikipedia'),
  },
  {
    title: `${t('trans')} - Bing`,
    href: `https://www.bing.com/search?q=${t('trans')}`,
  },
  {
    title: `${t('trans')} - Google`,
    href: `https://www.google.com/search?q=${t('trans')}`,
  },
  {
    title: t('about.mtf.sites.title.gd-fyi'),
    href: t('urls.gd_fyi'),
  },
  {
    title: 'MtF.Wiki',
    href: t('urls.mtf_wiki'),
  },
  {
    title: '2345.lgbt',
    href: t('urls.2345-lgbt'),
  },
]);
useSeoMeta({ title: $t('about.mtf.as-mtf') });

const timeInfo = computed(() => {
  const now = dayjs();
  const birthday = dayjs('2008/6/28');
  const wantTime = dayjs('2020');
  const identifyTime = dayjs('2025/11/17');
  const hrtStartTime = dayjs('2026/01/14');

  const years = now.diff(birthday, 'year');
  const months = now.diff(birthday, 'month');
  const days = now.diff(birthday, 'day');

  const totalLife = now.diff(birthday);

  const wantYears = now.diff(wantTime, 'year');
  const percentWant = round((now.diff(wantTime) / totalLife) * 100);

  const identifyMonths = now.diff(identifyTime, 'month');
  const percentIdentify = round((now.diff(identifyTime) / totalLife) * 100, 2);

  const hrtDays = now.diff(hrtStartTime, 'day') + 1;
  const percentHrt = round((now.diff(hrtStartTime) / totalLife) * 100, 2);

  return {
    years,
    months,
    days,
    wantYears,
    percentWant,
    identifyMonths,
    percentIdentify,
    hrtDays,
    percentHrt,
  };
});
</script>

<template>
  <AppPage data-pagefind-body>
    <div class="py-4 flex flex-col items-center justify-center gap-4 text-center px-10 mb-10">
      <h1 class="text-2xl font-bold font-monos">
        <span>{{ $t('about.welcome-to') }}</span>
        <br />
        <span>Kuriyona's Space</span>
        <span>&nbsp;/&nbsp;</span>
        <span data-pagefind-meta="title">{{ $t('about.mtf.as-mtf') }}</span>
      </h1>
    </div>
    <KCard v-if="isJune" class="relative hover:[&>div]:brightness-50 hover:[&>p]:text-white">
      <div
        class="absolute top-0 left-0 h-full w-full pride-bg rounded-xl brightness-25 transition-[filter] duration-300"></div>
      <p class="relative text-sm text-center transition-colors duration-300">
        {{ $t('about.mtf.pride-month') }}
      </p>
    </KCard>
    <KCard class="relative hover:[&>div]:brightness-50 hover:[&>p]:text-white">
      <div
        class="absolute top-0 left-0 h-full w-full trans-bg rounded-xl brightness-25 transition-[filter] duration-300"></div>
      <p class="relative text-sm text-center transition-colors duration-300">
        {{ $t('about.mtf.slogan') }}
      </p>
    </KCard>
    <KCard :title="$t('about.mtf.as-mtf')">
      <div class="flex gap-2 justify-between items-center">
        <div class="flex flex-col items-start trans-text">
          <p>{{ $t('about.mtf.im-mtf') }}</p>
          <p>
            {{ $t('about.days_on_earth', [timeInfo.years, timeInfo.months, timeInfo.days]) }}
          </p>
          <p>
            {{ $t('about.mtf.be-a-girl', [timeInfo.wantYears]) }}
            ({{ $t('about.mtf.percent-life', [timeInfo.percentWant]) }})
          </p>
          <p>
            {{ $t('about.mtf.identify_days', [timeInfo.identifyMonths]) }}
            ({{ $t('about.mtf.percent-life', [timeInfo.percentIdentify]) }})
          </p>
          <ClientOnly>
            <p>
              {{ $t('about.mtf.hrt_days', [timeInfo.hrtDays]) }}
              ({{ $t('about.mtf.percent-life', [timeInfo.percentHrt]) }})
            </p>
          </ClientOnly>
        </div>
        <div class="text-4xl large:text-nowrap">🏳️‍⚧️<br />🍥</div>
      </div>
    </KCard>
    <KCard :title="$t('about.about-me')">
      <div>
        <KCardLink to="/about" level :text="$t('about.my-site-home')" />
      </div>
    </KCard>
    <KCard :title="$t('about.mtf.about-trans')">
      <div class="flex flex-col gap-4">
        <KCardLink
          v-for="item in data"
          level
          :key="item.href"
          :to="item.href"
          :text="item.title"
          :new="true" />
      </div>
    </KCard>
  </AppPage>
</template>
