<script setup lang="ts">
const config = useAppConfig();
const ISSUE =
  'https://github.com/Kuriyona/Kuriyona.com/issues/new?template=申请友链---apply-for-a-link-exchange.md';
useSeoMeta({ title: $t('about.links.title') });
</script>

<template>
  <AppPage data-pagefind-body>
    <NuxtLinkLocale to="/">
      <KIconButton icon="material-symbols:arrow-back" />
    </NuxtLinkLocale>
    <h1 class="text-2xl" data-pagefind-meta="title">{{ $t('about.links.title') }}</h1>
    <KCard :title="$t('about.links.best-friends')">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <KPersonCard v-for="person in config.links.main" :key="person.name" v-bind="person" />
      </div>
    </KCard>
    <KCard :title="$t('about.links.other-friends')">
      <div class="grid grid-cols-1 md:grid-cols-2 content-stretch gap-2">
        <KCardLink
          v-for="link in config.links.others"
          :to="link.url"
          :text="link.title"
          :desc="link.desc"
          :img="link.avatar"
          :new="true" />
      </div>
    </KCard>
    <KCard :title="$t('about.links.friends')">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        <KCardLink
          v-for="link in config.links.links"
          :to="link.url"
          :text="link.title"
          :desc="link.desc"
          :img="link.avatar"
          :new="true" />
      </div>
    </KCard>
    <KCard :title="$t('about.links.exchange')">
      <div class="font-monos text-wrap break-all">
        <p>url : https://kuriyona.com</p>
        <p>title : Kuriyona's Space</p>
        <p>desc : {{ $t('about.description') }}</p>
        <p>avatar : https://r2.kuriyona.com/img/avatar/Avatar_256.png</p>
      </div>
      <br />
      <div>
        <KCardLink :to="ISSUE" :new="true" :text="$t('about.links.request-exchange')" />
      </div>
    </KCard>
  </AppPage>
</template>
