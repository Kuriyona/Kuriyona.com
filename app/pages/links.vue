<script setup lang="ts">
import Config from '../config.json';
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
    <var-divider :description="$t('best_friends')" />
    <KCardLink
      v-for="link in Config.links.main"
      :to="link.url"
      :text="link.title"
      :img="link.avatar"
      :new="true" />
    <var-divider :description="$t('other_friends')" />
    <KCardLink
      v-for="link in Config.links.others"
      :to="link.url"
      :text="link.title"
      :img="link.avatar"
      :new="true" />
    <var-divider :description="$t('links.add-me')" />
    <KCard class="font-mono text-wrap break-all">
      <p>url : https://kuriyona.com</p>
      <p>title : Kuriyona's Space</p>
      <p>desc : {{ $t('about.description') }}</p>
      <p>avatar : https://r2.kuriyona.com/img/avatar/Avatar_256.png</p>
    </KCard>
  </AppPage>
</template>
