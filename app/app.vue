<script setup lang="ts">
import AppBar from './components/AppBar.vue';
</script>

<template>
  <AppBar class="z-100 sticky top-0 backdrop-blur-lg" />
  <main>
    <NuxtPage id="main" class="z-0" />
  </main>
</template>

<style scoped></style>
