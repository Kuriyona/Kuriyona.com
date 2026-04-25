<script setup lang="ts">
const { t } = useI18n();
const isFetching = ref(false);
const update = async () => {
  isFetching.value = true;
  const res = await fetchApi.get('/status');
  status.value = await res.json();
  isFetching.value = false;
};
update();
const status = ref<undefined | any>(undefined);
</script>

<template>
  <div v-if="isFetching" class="flex gap-4">
    <var-loading size="small" />
    <span>{{ t('loading') }}</span>
  </div>
  <div v-if="status" class="link-style cursor-pointer" @click="update()">
    <span>{{ t('kuriyona_is_now') }}</span>
    <span v-if="status.awake == 'AWAKE'" class="text-green-500">{{ t('awake') }}</span>
    <span v-else-if="status.awake == 'SLEEP'" class="text-yellow-500">{{ t('sleeping') }} </span>
    <span v-else class="text-gray-500">...UNKNOWN</span>
  </div>
</template>
