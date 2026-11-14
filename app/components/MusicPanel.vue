<script setup lang="ts">
// 顶栏复合音乐按钮打开的悬浮面板，也是全站唯一音乐入口（≥768；<768 不提供音乐入口）。
// 状态都在 useMusic 单例里，播放不随面板开关中断。
const open = defineModel<boolean>({ required: true });
</script>

<template>
  <KDialog v-model="open" :title="$t('music.title')" width="max-w-sm">
    <MusicControls />
  </KDialog>
</template>
