<script setup lang="ts">
import { shallowRef } from 'vue';
import dayjs from 'dayjs';
import { useI18n } from '@/scripts/i18n';
import Config from '../config.json';
import QRCode from 'qrcode.vue';
import IAm from '~/components/IAm.vue';

const { t, locale } = useI18n();
const localePath = useLocalePath();

const Contact = shallowRef(Config.contact);
</script>

<template>
  <div class="font-mono flex justify-center h-full">
    <main class="w-160 my-20 p-4 flex flex-col gap-4">
      <IAm />
      <ClientOnly>
        <p>
          {{ t('days_on_earth', [dayjs().diff('2008/6/28', 'day') + 1]) }}
        </p>
        <Weather />
      </ClientOnly>
      <var-divider />
      <p>
        {{ t('description') }}
      </p>
      <ClientOnly>
        <div>
          <NuxtLinkLocale to="/about/as-mtf">
            <p class="trans-text underline">
              {{ t('hrt_days', [dayjs().diff('2026/01/17', 'day') + 1]) }}
            </p>
          </NuxtLinkLocale>
        </div>
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
        <p>· {{ t('tech_stack') }} : JavaScript/TypeScript (Vue, Node/Bun, Elysia), HTML/CSS, C#</p>
        <p>
          · {{ t('language') }}:
          {{ t('language_value') }}
        </p>
        <br />
        <CardLink to="/about/" :text="$t('global.read_more')" />
      </div>
      <var-divider />
      <VarAlert type="info" title="Tips" :message="$t('neko.tips')" />
      <div>
        <p>
          · {{ t('opensource') }} (MIT) :
          <a href="https://github.com/Kuriyona/Kuriyona.com" class="link-style">
            Kuriyona/Kuriyona.com
          </a>
        </p>
        <p>· {{ t('copyright') }} © {{ dayjs().format('YYYY') }} Kuriyona. All rights reserved.</p>
        <p>
          <span>·&nbsp;</span>
          <a href="https://icp.gov.moe/?keyword=20266280" target="_blank" class="link-style"
            >萌 ICP 备 20266280 号</a
          >
        </p>
      </div>
    </main>
  </div>
</template>
