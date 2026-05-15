<script setup lang="ts">
import AppBar from './components/AppBar.vue';
</script>

<template>
  <div class="relative h-screen scroll-hidden">
    <div class="z-100 sticky top-0 backdrop-blur-lg p-2">
      <AppBar />
    </div>
    <main>
      <Background />
      <NuxtPage id="main" class="z-0 font-mono" />
    </main>
  </div>
</template>
