<script setup lang="ts">
import Config from '../config.json';
useSeo({ title: $t('about.links') });
</script>

<template>
  <Page>
    <var-divider :description="$t('best_friends')" />
    <a :href="link.url" target="_blank" v-for="link in Config.links.main">
      <CardLink :to="link.url" :text="link.title" :img="link.avatar" />
    </a>
    <var-divider :description="$t('other_friends')" />
    <a :href="link.url" target="_blank" v-for="link in Config.links.others">
      <CardLink :to="link.url" :text="link.title" :img="link.avatar" :new="true" />
    </a>
  </Page>
</template>
