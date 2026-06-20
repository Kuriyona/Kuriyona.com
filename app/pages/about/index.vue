<script setup lang="ts">
const config = useAppConfig();
</script>

<template>
  <AppPage>
    <div class="py-4 flex flex-col items-center justify-center gap-4 text-center px-10 mb-10">
      <h1 class="text-2xl font-bold font-monos">
        <span>{{ $t('about.welcome-to') }}</span>
        <br />
        <span>Kuriyona's Space</span>
      </h1>
    </div>
    <div class="flex justify-center gap-4 max-[600px]:flex-col">
      <KCard :title="$t('about.about-me')" class="flex-1">
        <p>{{ $t('about.hello-i-am-kuriyona') }}</p>
        <p>{{ $t('about.also-weixi-yona') }}</p>
        <p>
          <NuxtLinkLocale to="/blog/about-name" class="link">{{
            $t('about.about-my-name')
          }}</NuxtLinkLocale>
        </p>
        <br />
        <p class="font-bold">{{ $t('about.description') }}</p>
      </KCard>
      <CardInfo class="min-w-[25%]" />
    </div>
    <KCardLink to="/blog">
      <template #content>
        <p>
          <span>{{ $t('global.read-more') }}</span>
          <span>&nbsp;·&nbsp;</span>
          <span>「{{ $t('blog.title') }}」</span>
        </p>
      </template>
    </KCardLink>
    <KCardLink to="/about/as-mtf">
      <template #content>
        <p class="trans-text">
          <span>{{ $t('global.read-more') }}</span>
          <span>&nbsp;·&nbsp;</span>
          <span>「{{ $t('about.mtf.as-mtf') }}」</span>
        </p>
      </template>
    </KCardLink>
    <div class="flex justify-center gap-4 max-[600px]:flex-col">
      <KCard :title="$t('about.location')" class="flex-1">
        <div class="relative max-h-40 h-full w-full">
          <p
            class="absolute bottom-0 left-0 text-black/80 text-sm backdrop-blur-md p-1 rounded-tr-md">
            {{ $t('about.location-value') }}
          </p>
          <img
            class="h-full w-full object-cover max-[400px]:hidden"
            src="https://r2.kuriyona.com/static/image/site/location-map-600.png" />
          <img
            class="h-full w-full object-cover min-[400px]:hidden"
            src="https://r2.kuriyona.com/static/image/site/location-map-400.png" />
        </div>
      </KCard>
      <CardWeather />
    </div>
    <KCard :title="$t('about.skills')">
      <div class="flex justify-center gap-2 max-[600px]:flex-col">
        <div class="flex gap-2 flex-wrap justify-center">
          <img
            v-for="item in config.tech_stack"
            :key="item.name"
            :alt="item.name"
            :src="`https://img.shields.io/badge/${encodeURIComponent(item.name)}-black?style=for-the-badge&logo=${item.icon}`" />
        </div>
        <var-divider vertical class="max-[600px]:hidden" />
        <var-divider class="min-[600px]:hidden" />
        <div class="flex gap-2 flex-wrap justify-center">
          <img
            v-for="item in config.languages"
            :key="item.name"
            :alt="$t(item.name)"
            :src="`https://img.shields.io/badge/${item.icon}-${$t(item.name)}-black?style=for-the-badge`" />
        </div>
      </div>
    </KCard>
    <CardContact />
    <CardGames />
    <KCard :title="$t('about.links.title')">
      <div class="flex flex-col gap-2">
        <KCardLink
          v-for="link in config.links.main"
          level
          :to="link.url"
          :text="link.title"
          :img="link.avatar"
          :new="true" />
        <KCardLink level to="/links" :text="$t('more')" />
      </div>
    </KCard>
  </AppPage>
</template>
