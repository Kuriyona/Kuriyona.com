<script setup lang="ts">
// 窄视口（reserve: 断点以下）左保留区不显示播放器，顶栏的复合按钮打开这个悬浮面板来替代它。
// 面板内容与保留区卡片共用 MusicControls，状态都在 useMusic 单例里，两处显示的是同一个播放器。
const open = defineModel<boolean>({ required: true });
</script>

<template>
  <KDialog v-model="open" :title="$t('music.title')" width="max-w-sm">
    <MusicControls />
  </KDialog>
</template>
