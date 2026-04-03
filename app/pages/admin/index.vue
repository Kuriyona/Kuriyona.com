<script setup lang="ts">
import { useStorage } from '@vueuse/core';

const key = useStorage('API_KEY', '');
const { $api } = useNuxtApp();

const updateStatus = (awake: boolean) => {
  $api.status.update.get({
    query: {
      auth: key.value,
      status: awake ? 'awake' : 'sleep'
    }
  });
};
</script>

<template>
  <div class="flex flex-col gap-2 m-4">
    <var-input v-model="key" />
    <var-button @click="updateStatus(true)">Awake</var-button>
    <var-button @click="updateStatus(false)">Sleep</var-button>
  </div>
</template>
