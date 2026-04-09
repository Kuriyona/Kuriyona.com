<script setup lang="ts">
import { shallowRef } from 'vue';
import dayjs from 'dayjs';
import { useI18n } from '@/scripts/i18n';
import Config from '../config.json';

const { $api } = useNuxtApp();

const isFetching = ref(false);
const update = async () => {
  isFetching.value = true;
  const res = await $api.status.get();
  status.value = res.data;
  isFetching.value = false;
};
update();
const status = ref<undefined | any>(undefined);

const { t } = useI18n();

const Contact = shallowRef(Config.contact);
</script>

<template>
  <!--{{ t(['', '']) }}-->
  <div class="font-mono flex justify-center h-full">
    <main class="w-160 my-20 p-4 flex flex-col gap-4">
      <img
        class="w-10 rounded-sm"
        src="https://r2.kuriyona.com/img/avatar/Avatar_256.png" />
      <h1 class="text-2xl">I'm Kuriyona</h1>
      <div v-if="isFetching" class="flex gap-4">
        <var-loading size="small" />
        <span>{{ t(['Loading status...', '加载状态中...']) }}</span>
      </div>
      <div v-if="status" class="link-style cursor-pointer" @click="update()">
        <span>{{ t(['Kuriyona is now ', 'Kuriyona 现在 ']) }}</span>
        <span v-if="status.awake == 'AWAKE'" class="text-green-500">{{
          t(['AWAKE', '醒着'])
        }}</span>
        <span v-else-if="status.awake == 'SLEEP'" class="text-yellow-500"
          >{{ t(['SLEEPING', '睡着']) }}
        </span>
        <span v-else class="text-gray-500">...UNKNOWN</span>
      </div>
      <p>
        {{
          t([
            'Kuriyona has been in to this world for ',
            '今天是 Kuriyona 来到这个世界的第 '
          ])
        }}{{ dayjs().diff('2008/6/28', 'day') + 1 }}{{ t([' days', ' 天']) }}
      </p>
      <hr />
      <p>
        {{
          t([
            'A 17-year-old Chinese senior high school student, otaku, casual anime fan, MtF, and interest-driven developer.',
            '17 岁中国高中生，宅，亚二次元，MtF 和兴趣使然的开发者'
          ])
        }}
      </p>
      <p>
        {{
          t([
            'As a MtF, I have started HRT/GAHT for ',
            '作为一个 MtF，我已经开始了 HRT/GAHT '
          ])
        }}{{ dayjs().diff('2026/01/17', 'day') + 1
        }}{{ t([' days.', ' 天。']) }}
      </p>
      <div>
        <p>
          · {{ t(['Location', '所在地']) }}:
          {{ t(['Hangzhou, Zhejiang, the P.R.China', '中国，浙江省，杭州市']) }}
          ( 120° E, 30° N )
        </p>
        <p>
          · {{ t(['Birthday', '生日']) }}:
          {{ t(['June 28th (2008)', '六月 28 (2008)']) }}
        </p>
        <p>
          · {{ t(['Tech stack', '技术栈']) }} : JavaScript/TypeScript (Vue,
          Node/Bun, Elysia), HTML/CSS, C#
        </p>
        <p>
          · {{ t(['Language', '语言']) }}:
          {{
            t([
              'Mandarin Chinese, English & Japanese (Learning)',
              '中文/普通话，英文，初学日文'
            ])
          }}
        </p>
      </div>
      <hr />
      <div>
        {{ t(['You can find me on', '你可以通过以下途径找到我']) }}
        <br />
        <p v-for="(link, name) in Contact">
          <span>·&nbsp;</span>
          <a :key="name" :href="link" target="_blank" class="link-style">
            {{ name }}
          </a>
        </p>
        <p>· {{ t(['Wechat', '微信']) }} : @Kuriyota</p>
        <p>· QQ: ID 2946733291</p>
      </div>
      <hr />
      <div>
        <p>· {{ t(['Links', '友情链接']) }} :</p>
        <p v-for="link in Config.links.main">
          &nbsp;&nbsp;·
          <a :href="link.url" class="link-style">{{ t([link.en, link.zh]) }}</a>
        </p>
        <p>
          · {{ t(['OpenSource', '开源']) }} (MIT) :
          <a href="https://github.com/Kuriyona/Kuriyona.com" class="link-style">
            Kuriyona/Kuriyona.com
          </a>
        </p>
        <p>
          · {{ t(['Copyright', '版权所有']) }} ©
          {{ dayjs().format('YYYY') }} Kuriyona. All rights reserved.
        </p>
      </div>
    </main>
  </div>
</template>
