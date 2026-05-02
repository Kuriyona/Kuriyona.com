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
        <VarCard>
          <div class="flex gap-4 items-center">
            <img :src="link.avatar" class="w-8 h-8 rounded-2xl" />
            <p>
              {{ link.title }}
            </p>
          </div>
        </VarCard>
      </a>
      <h1 class="text-2xl mt-10">
        {{ $t('other_friends') }}
      </h1>
      <a :href="link.url" target="_blank" v-for="link in Config.links.others">
        <VarCard>
          <div class="flex gap-4 items-center">
            <img :src="link.avatar" class="w-8 h-8 rounded-2xl" />
            <p>
              {{ link.title }}
            </p>
          </div>
        </VarCard>
      </a>
    </main>
  </div>
</template>
