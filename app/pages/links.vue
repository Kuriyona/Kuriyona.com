<script setup lang="ts">
import { useI18n } from '~/scripts/i18n';
import Config from '../config.json';
</script>

<template>
  <div class="font-mono flex justify-center h-full">
    <main class="w-160 my-20 p-4 flex flex-col gap-4">
      <h1 class="text-2xl">
        {{ $t('best_friends') }}
      </h1>
      <a :href="link.url" target="_blank" v-for="link in Config.links.main">
        <CardLink :to="link.url" :text="link.title" :img="link.avatar" />
      </a>
      <h1 class="text-2xl mt-10">
        {{ $t('other_friends') }}
      </h1>
      <a :href="link.url" target="_blank" v-for="link in Config.links.others">
        <CardLink :to="link.url" :text="link.title" :img="link.avatar" :new="true" />
      </a>
    </main>
  </div>
</template>
