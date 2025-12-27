<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import dayjs from 'dayjs';
import { useFetch } from '@vueuse/core';
import { useI18n } from '@/scripts/i18n';

const HOST = import.meta.env.DEV
  ? 'http://localhost:62801'
  : 'https://api.kuriyota.com';
const { isFetching, data } = useFetch<any>(HOST + '/status');
const status = computed(() => JSON.parse(data.value));

const __BUILD_TIME__ = import.meta.env.VITE_BUILD_TIME;

const { t } = useI18n();

const Contact = shallowRef({
  Github: 'https://github.com/Kuriyota',
  Bilibili: 'https://space.bilibili.com/650631530',
  X: 'https://x.com/cn_Kuriyota',
  Zhihu: 'https://www.zhihu.com/people/cn-chestnut',
  Telegram: 'https://t.me/Kuriyota',
  'Kuriyota@outlook.com': 'mailto:kuriyota@outlook.com'
});
</script>

<template>
  <!--{{ t(['', '']) }}-->
  <div class="-index font-mono flex justify-center h-full">
    <main class="w-160 my-20 p-4 flex flex-col gap-4">
      <img
        class="w-10 rounded-sm"
        src="https://avatars.githubusercontent.com/u/98728485" />
      <h1 class="text-2xl">
        I'm Kuriyota
        <span class="text-gray-500">(Kuriyona)</span>
      </h1>
      <div v-if="isFetching" class="flex gap-4">
        <var-loading size="small" />
        <span>{{ t(['Loading status...', '加载状态中...']) }}</span>
      </div>
      <div v-if="data && status?.awake">
        <span>{{ t(['Kuriyota is now ', 'Kuriyota 现在 ']) }}</span>
        <span v-if="status.awake == 'AWAKE'" class="text-green-500">{{
          t(['AWAKE', '醒着'])
        }}</span>
        <span v-else-if="status.awake == 'SLEEP'" class="text-yellow-500"
          >{{ t(['SLEEPING', '睡着']) }}
        </span>
        <span v-else class="text-gray-500">...UNKNOWN</span>
      </div>
      <hr />
      <p>
        {{
          t([
            'A 17-year-old Chinese senior high school student, otaku, casual anime fan, MtF, and interest-driven developer.',
            '17 岁中国高中生，宅，亚二次元，MtF 和兴趣使然的开发者'
          ])
        }}
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
      <p>
        {{ t(['I am the founder of', '我是这个工作室的成立者：']) }}
        <a href="https://github.com/SharpDotNUT/" target="_blank">
          #.NUT Studio
        </a>
        ,
        <br />
        {{ t(['and my project ', '以及我的项目']) }}：
        <a
          href="https://github.com/SharpDotNUT/Prototype-YunHan"
          target="_blank"
          >「Prototype · YunHan」
        </a>
      </p>
      <hr />
      <div>
        {{ t(['You can find me on', '你可以通过以下途径找到我']) }}
        <br />
        <p v-for="(link, name) in Contact">
          <span>·&nbsp;</span>
          <a :key="name" :href="link" target="_blank">
            {{ name }}
          </a>
        </p>
        <p>· {{ t(['Wechat', '微信']) }} : @Kuriyota</p>
        <p>· QQ: ID 2946733291</p>
      </div>
      <hr />
      <div class="flex gap-2 pb-2 overflow-x-auto">
        <img src="https://hoyocard.qhy04.com/gs/0/306863519.png" />
        <img src="https://hoyocard.qhy04.com/sr/2/306863519.png" />
        <img src="https://hoyocard.qhy04.com/zzz/0/306863519.png" />
      </div>
      <hr />
      <div>
        <p>
          · {{ t(['Build time', '构建时间']) }} :
          {{ dayjs(__BUILD_TIME__).format('YYYY-MM-DD HH:mm:ss') }}
        </p>
        <p>
          · {{ t(['OpenSource', '开源']) }} (MIT) :
          <a href="https://github.com/Kuriyota/Kuriyota.com">
            Kuriyota/Kuriyota.com
          </a>
        </p>
        <p>
          · {{ t(['Copyright', '版权所有']) }} ©
          {{ dayjs().format('YYYY') }} Kuriyota. All rights reserved.
        </p>
      </div>
    </main>
  </div>
</template>

<style lang="css" scoped></style>
