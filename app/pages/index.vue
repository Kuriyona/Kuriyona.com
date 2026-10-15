<script setup lang="ts">
const config = useAppConfig();
const aboutNav = useAboutNav();

// 常住城市卡片：城市配置由 KV 提供（见 /api/city），预渲染阶段拿不到，切到客户端后再取
const { data: cities } = useCity();
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

    <!-- 关于我（左） + 常驻城市（右）：窄屏换成两行，城市数据缺失时关于我独占整行 -->
    <div class="grid grid-cols-1 gap-4" :class="{ 'min-[900px]:grid-cols-[2fr_1fr]': cities }">
      <KCard :title="$t('about.about-me')">
        <p class="whitespace-pre-line">
          {{ $t('about.hello-i-am-kuriyona') }}
          <NuxtLinkLocale to="/blog/about-name" class="link">{{
            $t('about.about-my-name')
          }}</NuxtLinkLocale>
        </p>
        <p class="mt-4 whitespace-pre-line">{{ $t('about.intro') }}</p>
      </KCard>
      <CardCityMap
        v-if="cities?.resident"
        :title="$t('about.city-resident')"
        :city="cities.resident" />
    </div>

    <!-- 生日 / MBTI：各自独立成块，两列（最窄屏也不换行，所以纵向排图标-标签-值） -->
    <div class="grid grid-cols-2 gap-4">
      <KCard class="text-center">
        <div class="flex flex-col items-center gap-1">
          <KIcon name="material-symbols:cake" class="text-2xl text-(--color-text-4)" />
          <p class="text-xs text-(--color-text-3)">{{ $t('about.birth') }}</p>
          <p class="font-monos text-base font-bold sm:text-lg">
            <time :datetime="config.info.birth">{{ config.info.birth }}</time>
          </p>
        </div>
      </KCard>
      <KCard class="text-center">
        <div class="flex flex-col items-center gap-1">
          <KIcon name="material-symbols:psychology" class="text-2xl text-(--color-text-4)" />
          <p class="text-xs text-(--color-text-3)">MBTI</p>
          <p class="font-monos text-base font-bold sm:text-lg">{{ config.info.mbti }}</p>
        </div>
      </KCard>
    </div>

    <KCard :title="$t('about.skills')">
      <div class="flex gap-2 flex-wrap justify-center">
        <KSurface
          v-for="item in config.tech_stack"
          :key="item.name"
          class="k-interactive flex items-center gap-2 px-3 py-2 rounded-xl text-sm">
          <KIcon :name="item.icon" class="text-xl text-(--color-text-1)" />
          <span>{{ item.name }}</span>
        </KSurface>
        <span
          class="hidden min-[600px]:block self-center w-px h-8 bg-(--color-line-strong) mx-1"></span>
        <KSurface
          v-for="item in config.languages"
          :key="item.name"
          class="k-interactive flex items-center gap-2 px-3 py-2 rounded-xl text-sm">
          <KIcon name="material-symbols:translate" class="text-xl text-(--color-text-1)" />
          <span
            class="px-1.5 py-0.5 bg-white rounded-sm text-[10px] font-bold text-black leading-none"
            >{{ item.icon }}</span
          >
          <span>{{ item.name }}</span>
        </KSurface>
      </div>
    </KCard>

    <div class="grid grid-cols-1 min-[900px]:grid-cols-2 gap-4">
      <KNavCard
        v-for="item in aboutNav"
        :key="item.to"
        :to="item.to"
        :title="item.title"
        :desc="item.desc"
        :trans="item.to === '/about/trans'" />
    </div>
    <KNavCard
      to="/friends-and-links"
      :title="$t('about.links.title')"
      :desc="$t('about.links.desc')" />

    <CardContact />
  </AppPage>
</template>
