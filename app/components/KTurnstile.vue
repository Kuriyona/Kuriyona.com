<script setup lang="ts">
import VueTurnstile from 'vue-turnstile';
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();
const Turnstile = useTemplateRef('turnstile');
const token = ref('');
const loading = ref(false);
const verify = async (token: string) => {
  loading.value = true;
  const res = await fetchApi('/turnstile', {
    searchParams: { token },
  }).text();
  if (res) {
    mainStore.jwt = res;
    Snackbar.success($t('global.verifySuccess'));
  } else {
    Turnstile.value?.reset();
  }
  loading.value = false;
};
</script>

<template>
  <var-card>
    <div class="flex flex-col gap-2">
      <p class="text-center">{{ $t('turnstile.tip') }}</p>
      <VueTurnstile
        ref="turnstile"
        site-key="0x4AAAAAADTR98IL1RUn8gKN"
        v-model="token"
        size="flexible" />
      <var-button @click="verify(token)" block :loading="loading">
        {{ $t('global.verify') }}
      </var-button>
    </div>
  </var-card>
</template>
