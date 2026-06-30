<script setup lang="ts">
import VueTurnstile from 'vue-turnstile';
import { useMainStore } from '@/stores/main';

const show = ref(true);

const mainStore = useMainStore();
if (mainStore.jwt) {
  show.value = false;
}
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
    show.value = false;
  } else {
    Snackbar.error($t('global.verifyFail'));
    Turnstile.value?.reset();
  }
  loading.value = false;
};
watch(token, (newVal) => {
  if (newVal !== '') {
    verify(newVal);
  }
});
</script>

<template>
  <KCard v-if="show">
    <div class="flex flex-col gap-4">
      <p class="text-center">{{ $t('turnstile.tip') }}</p>
      <VueTurnstile
        ref="turnstile"
        site-key="0x4AAAAAADTR98IL1RUn8gKN"
        v-model="token"
        size="flexible" />
    </div>
  </KCard>
</template>
