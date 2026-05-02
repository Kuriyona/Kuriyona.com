<script setup lang="ts">
import AppBar from './components/AppBar.vue';
</script>

<template>
  <AppBar class="z-100 sticky top-0 backdrop-blur-lg" />
  <main>
    <Transition name="page">
      <NuxtPage id="main" class="z-0" />
    </Transition>
  </main>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
