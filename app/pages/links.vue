<script setup lang="ts">
const config = useAppConfig();
useSeoMeta({ title: $t('about.links.title') });
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/about">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h1 class="text-2xl">{{ $t('about.links.title') }}</h1>
    <KCard :title="$t('about.links.best-friends')">
      <div class="flex flex-col gap-2">
        <KCardLink
          v-for="link in config.links.main"
          level
          :to="link.url"
          :text="link.title"
          :img="link.avatar"
          :new="true" />
      </div>
    </KCard>
    <KCard :title="$t('about.links.other-friends')">
      <div class="grid grid-cols-1 md:grid-cols-2 content-stretch gap-2">
        <KCardLink
          v-for="link in config.links.others"
          level
          :to="link.url"
          :text="link.title"
          :desc="link.desc"
          :img="link.avatar"
          :new="true" />
      </div>
    </KCard>
    <KCard :title="$t('about.links.title')">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        <KCardLink
          v-for="link in config.links.links"
          level
          :to="link.url"
          :text="link.title"
          :desc="link.desc"
          :img="link.avatar"
          :new="true" />
      </div>
    </KCard>
    <KCard :title="$t('about.links.add-me')">
      <div class="font-mono text-wrap break-all">
        <p>url : https://kuriyona.com</p>
        <p>title : Kuriyona's Space</p>
        <p>desc : {{ $t('about.description') }}</p>
        <p>avatar : https://r2.kuriyona.com/img/avatar/Avatar_256.png</p>
      </div>
    </KCard>
  </AppPage>
</template>
