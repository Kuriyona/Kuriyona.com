<script setup lang="ts">
const config = useAppConfig();
useSeoMeta({ title: $t('about.links') });
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/about">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h1 class="text-2xl">{{ $t('about.links') }}</h1>
    <KCard :title="$t('best_friends')">
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
    <KCard :title="$t('other_friends')">
      <div class="flex flex-col gap-2">
        <KCardLink
          v-for="link in config.links.others"
          level
          :to="link.url"
          :text="link.title"
          :img="link.avatar"
          :new="true" />
      </div>
    </KCard>
    <KCard :title="$t('links.add-me')">
      <div class="font-mono text-wrap break-all">
        <p>url : https://kuriyona.com</p>
        <p>title : Kuriyona's Space</p>
        <p>desc : {{ $t('about.description') }}</p>
        <p>avatar : https://r2.kuriyona.com/img/avatar/Avatar_256.png</p>
      </div>
    </KCard>
  </AppPage>
</template>
