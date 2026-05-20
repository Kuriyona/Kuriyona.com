<script setup lang="ts">
import VueTurnstile from 'vue-turnstile';
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();
const token = ref();

const onSubmit = async (token: string) => {
  const res = await fetchApi('/turnstile', {
    searchParams: { token },
  }).text();
  if (res) {
    mainStore.jwt = res;
    Snackbar.success('验证成功');
  } else {
    Snackbar.error('验证失败');
  }
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <p>请验证您的身份</p>
    <VueTurnstile site-key="0x4AAAAAADTR98IL1RUn8gKN" v-model="token" />
    <var-button @click="onSubmit(token)" block>验证</var-button>
  </div>
</template>
