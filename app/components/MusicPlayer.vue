<template>
  <!-- 播放器卡片：歌名/歌词/进度/控制/曲目列表都在 MusicControls，面板（MusicPanel）复用同一份主体 -->
  <KCard :title="$t('music.title')">
    <MusicControls />
  </KCard>
</template>
