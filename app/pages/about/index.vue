<script setup lang="ts">
const config = useAppConfig();
</script>

<template>
  <AppPage>
    <div class="py-4 flex flex-col items-center justify-center gap-4 text-center px-10 mb-10">
      <h1 class="text-2xl font-bold">
        <span>你好，欢迎来到</span>
        <br />
        <span>Kuriyona's Space</span>
      </h1>
    </div>
    <div class="flex justify-center gap-4 max-[400px]:flex-col">
      <KCard :title="$t('about.about-me')" class="flex-1">
        <p>{{ $t('about.hello-i-am-kuriyona') }}</p>
        <p>{{ $t('about.also-weixi-yona') }}</p>
        <br />
        <p class="font-bold">{{ $t('about.description') }}</p>
      </KCard>
      <CardInfo />
    </div>
    <KCardLink to="/about-mtf">
      <template #content>
        <p class="trans-text">{{ $t('about.mtf.as-mtf') }}</p>
      </template>
    </KCardLink>
    <div class="flex justify-center gap-4 max-[600px]:flex-col">
      <KCard :title="'未晞所在地'" class="flex-1">
        <div class="relative max-h-40 h-full w-full">
          <p class="absolute bottom-1 left-1 text-black/80 text-sm backdrop-blur-md p-1 rounded-md">
            浙江省，杭州市，临安区
          </p>
          <img
            class="h-full w-full object-cover max-[400px]:hidden"
            src="https://r2.kuriyona.com/static/image/site/location-map-600.png" />
          <img
            class="h-full w-full object-cover min-[400px]:hidden"
            src="https://r2.kuriyona.com/static/image/site/location-map-400.png" />
        </div>
      </KCard>
      <KCard :title="'未晞所在地天气'">
        <CardWeather />
      </KCard>
    </div>
    <KCard :title="'未晞的技能'">
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
    <KCard :title="'找到我'">
      <div class="flex flex-wrap gap-2 justify-center">
        <KCardLink
          level
          v-for="link in config.contact"
          :key="link.name"
          :to="link.link"
          :text="link.value"
          :new="true">
          <div class="flex items-center gap-4">
            <span v-if="link.mdIcon" class="material-symbols-outlined"> mail </span>
            <img
              v-if="link.icon"
              class="w-4 h-4"
              :src="`https://cdn.simpleicons.org/${link.icon}/white`" />
            <span>{{ link.i18nKey ? $t(link.i18nKey) : link.name }}</span>
          </div>
        </KCardLink>
      </div>
    </KCard>
  </AppPage>
</template>
