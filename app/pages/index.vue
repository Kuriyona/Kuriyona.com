<script setup lang="ts">
import { shallowRef } from 'vue';
import dayjs from 'dayjs';
import { useI18n } from '@/scripts/i18n';
import Config from '../config.json';
import QRCode from 'qrcode.vue';

const { t, locale } = useI18n();
const localePath = useLocalePath();

const Contact = shallowRef(Config.contact);
</script>

<template>
  <div>
    <Background />
    <div class="font-mono flex justify-center h-full">
      <main class="w-160 my-20 p-4 flex flex-col gap-4">
        <div class="h-[40vh] flex flex-col items-center justify-center gap-4">
          <img class="w-10 rounded-sm" src="https://r2.kuriyona.com/img/avatar/Avatar_256.png" />
          <h1 class="text-2xl">
            I'm Kuriyona (<ruby>未晞<rt>Weixi</rt></ruby
            >)
          </h1>
        </div>
        <ClientOnly>
          <p>
            {{ t('days_on_earth', [dayjs().diff('2008/6/28', 'day') + 1]) }}
          </p>
          <Weather />
        </ClientOnly>
        <VarAlert type="info" title="Tips" :message="$t('neko.tips')" />
        <hr />
        <p>
          {{ t('description') }}
        </p>
        <ClientOnly>
          <p>{{ t('hrt_days', [dayjs().diff('2026/01/17', 'day') + 1]) }} | 🏳️‍⚧️🍥</p>
        </ClientOnly>
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
          <p>
            · {{ t('tech_stack') }} : JavaScript/TypeScript (Vue, Node/Bun, Elysia), HTML/CSS, C#
          </p>
          <p>
            · {{ t('language') }}:
            {{ t('language_value') }}
          </p>
        </div>
        <hr />
        <div>
          {{ t('find_me_on') }}
          <br />
          <p v-for="link in Contact">
            <span>·&nbsp;</span>
            <span>{{ link.i18nKey ? t(link.i18nKey) : link.name }}</span>
            <span>&nbsp;:&nbsp;</span>
            <a
              v-if="link.link"
              :key="link.name"
              :href="link.link"
              target="_blank"
              class="link-style">
              {{ link.value }}
            </a>
            <span v-else>{{ link.value }}</span>
          </p>
        </div>
        <hr />
        <div>
          <p>· {{ t('links') }} :</p>
          <p v-for="link in Config.links.main">
            &nbsp;&nbsp;·
            <a :href="link.url" class="link-style">{{ link.title }}</a>
          </p>
          <p>
            &nbsp;&nbsp;·
            <nuxt-link-locale to="/links" class="link-style">{{ t('more') }}...</nuxt-link-locale>
          </p>
        </div>
        <hr />
        <div>
          <p>
            · {{ t('opensource') }} (MIT) :
            <a href="https://github.com/Kuriyona/Kuriyona.com" class="link-style">
              Kuriyona/Kuriyona.com
            </a>
          </p>
          <p>
            · {{ t('copyright') }} © {{ dayjs().format('YYYY') }} Kuriyona. All rights reserved.
          </p>
          <p>
            <span>·&nbsp;</span>
            <a href="https://icp.gov.moe/?keyword=20266280" target="_blank" class="link-style"
              >萌 ICP 备 20266280 号</a
            >
          </p>
        </div>
      </main>
    </div>
  </div>
</template>
