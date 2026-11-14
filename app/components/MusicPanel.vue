<script setup lang="ts">
// 顶栏复合音乐按钮打开的悬浮面板（≥768 的音乐入口；<768 用 AppMenu 抽屉里的播放器）。
// 面板内容与抽屉共用 MusicControls，状态都在 useMusic 单例里，两处显示的是同一个播放器。
const open = defineModel<boolean>({ required: true });
</script>

<template>
  <KDialog v-model="open" :title="$t('music.title')" width="max-w-sm">
    <MusicControls />
  </KDialog>
</template>
