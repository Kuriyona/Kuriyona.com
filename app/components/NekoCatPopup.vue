<script setup lang="ts">
import NekoChat from './NekoChat.vue';
const show = defineModel<boolean>('show');
</script>

<template>
  <VarPopup v-model:show="show" class="rounded-l-xl" position="right">
    <div class="relative flex flex-col h-full w-120 max-w-[80vw] overflow-hidden">
      <div class="flex justify-between items-center px-6 py-2">
        <span>{{ $t('neko.title') }}</span>
        <VarButton round text @click="show = false">
          <span class="material-symbols-outlined"> close </span>
        </VarButton>
      </div>
      <NekoChat />
    </div>
  </VarPopup>
</template>
