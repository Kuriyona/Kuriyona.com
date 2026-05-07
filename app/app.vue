<script setup lang="ts">
import AppBar from './components/AppBar.vue';
</script>

<template>
  <div class="relative h-screen scroll-hidden">
    <AppBar class="z-100 sticky top-0 backdrop-blur-lg" />
    <main>
      <NuxtPage id="main" class="z-0" />
    </main>
  </div>
</template>
