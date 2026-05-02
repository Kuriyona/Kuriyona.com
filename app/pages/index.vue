<script setup lang="ts">
import { shallowRef } from 'vue';
import dayjs from 'dayjs';
import { useI18n } from '@/scripts/i18n';
import Config from '../config.json';

const { t, locale } = useI18n();

const Contact = shallowRef(Config.contact);

const linkName = (link: { en: string; zh: string }) => (locale.value === 'zh' ? link.zh : link.en);
</script>

<template>
  <div class="font-mono flex justify-center h-full">
    <main class="w-160 my-20 p-4 flex flex-col gap-4">
      <img class="w-10 rounded-sm" src="https://r2.kuriyona.com/img/avatar/Avatar_256.png" />
      <h1 class="text-2xl">I'm Kuriyona (未晞)</h1>
      <p>
        {{ t('days_on_earth', [dayjs().diff('2008/6/28', 'day') + 1]) }}
      </p>
      <hr />
      <p>
        {{ t('description') }}
      </p>
      <p>
        {{ t('hrt_days', [dayjs().diff('2026/01/17', 'day') + 1]) }}
      </p>
      <div>
        <p>
          · {{ t('location') }}:
          {{ t('location_value') }}
          ( 120° E, 30° N )
        </p>
        <p>
          · {{ t('birthday') }}:
          {{ t('birthday_value') }}
        </p>
        <p>· {{ t('tech_stack') }} : JavaScript/TypeScript (Vue, Node/Bun, Elysia), HTML/CSS, C#</p>
        <p>
          · {{ t('language') }}:
          {{ t('language_value') }}
        </p>
        <p>
          · {{ t('gender') }}:
          {{ t('gender_value') }}
        </p>
      </div>
      <hr />
      <div>
        {{ t('find_me_on') }}
        <br />
        <p v-for="(link, name) in Contact">
          <span>·&nbsp;</span>
          <a :key="name" :href="link" target="_blank" class="link-style">
            {{ name }}
          </a>
        </p>
        <p>· {{ t('wechat') }} : @Kuriyota</p>
        <p>· QQ: ID 2946733291</p>
      </div>
      <hr />
      <div>
        <p>· {{ t('links') }} :</p>
        <p v-for="link in Config.links.main">
          &nbsp;&nbsp;·
          <a :href="link.url" class="link-style">{{ linkName(link) }}</a>
        </p>
        <p>
          &nbsp;&nbsp;·
          <nuxt-link to="/links" class="link-style">{{ t('more') }}...</nuxt-link>
        </p>
        <p>
          · {{ t('opensource') }} (MIT) :
          <a href="https://github.com/Kuriyona/Kuriyona.com" class="link-style">
            Kuriyona/Kuriyona.com
          </a>
        </p>
        <p>· {{ t('copyright') }} © {{ dayjs().format('YYYY') }} Kuriyona. All rights reserved.</p>
      </div>
    </main>
  </div>
</template>
