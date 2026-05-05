<script setup lang="ts">
const weather = ref<any>(undefined);

onMounted(() => {
  fetchApi.get('/weather').then(async (res) => {
    weather.value = await res.json();
  });
});
</script>

<template>
  <span v-if="weather"> {{ weather.now.text }} {{ weather.now.temp }}°C </span>
</template>
