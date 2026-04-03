<script setup lang="ts">
import { HOST } from '@/scripts/api';
import { useStorage } from '@vueuse/core';

const key = useStorage('API_KEY', '');

const updateStatus = (awake: boolean) => {
  fetch(
    HOST +
      `/status/update?auth=${key.value}&status=${awake ? 'awake' : 'sleep'}`
  );
};
</script>

<template>
  <div class="flex flex-col gap-2 m-4">
    <var-input v-model="key" />
    <var-button @click="updateStatus(true)">Awake</var-button>
    <var-button @click="updateStatus(false)"> Sleep</var-button>
  </div>
</template>
