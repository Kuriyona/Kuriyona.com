<script setup lang="ts">
import Config from '../config.json';
import { codeToHtml } from 'shiki';
useSeoMeta({ title: $t('about.links') });
const MY = ref(`const myLink = new Link()
myLink.name = "Kuriyona"
myLink.url = "https://kuriyona.com"
myLink.desc = "${$t('about.description')}"
myLink.avatar = "https://r2.kuriyona.com/img/avatar/Avatar_256.png"
youLinks.push(myLink)
`);
onMounted(async () => {
  MY.value = await codeToHtml(MY.value, { lang: 'ts', theme: 'github-dark' });
});
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
    <var-divider :description="$t('links.add-me')" />
    <Card>
      <div v-html="MY" class="*:bg-transparent! *:text-wrap"></div>
    </Card>
  </Page>
</template>
