<script setup lang="ts">
import ky from 'ky';
import type { Lyric, PlaylistDetails, SongDetail } from '~/utils/types/music';
const store = useMusicStore();

const url = computed(() => {
  if (store.currentSong?.id === 442016694) {
    return 'https://r2.kuriyona.com/static/163-music/song/442016694.mp3';
  }
  return `https://meting.20100907.xyz/api?server=netease&type=url&id=${store.currentSong?.id}`;
});
const cover = computed(() => store.currentSong?.album?.picUrl + '?param=64x64');
const audio = useTemplateRef<HTMLAudioElement>('audio');
const { playing, currentTime } = useMediaControls(audio);

const currentLyricLine = computed(() => {
  const index =
    (store.currentLyric?.lines.findIndex((line) => line.time >= currentTime.value) ?? 1) - 1;
  return store.currentLyric?.lines[index];
});
</script>

<template>
  <div
    v-if="store.currentSong"
    id="music-bar"
    class="h-10 hover:h-16 flex items-center gap-2 text-nowrap truncate">
    <audio ref="audio" :src="url" autoplay></audio>
    <img :src="cover" class="h-full hidden" />
    <div class="flex justify-between w-full">
      <div id="main" class="flex items-center gap-1 min-w-0 h-fit">
        <div class="flex items-center">
          <KButton round text @click="playing = !playing">
            <span class="material-symbols-outlined">
              {{ playing ? 'pause' : 'play_arrow' }}
            </span>
          </KButton>
          <!--反向切歌是特意行为-->
          <KButton round text class="hover-show" @click="store.currentIndex++">
            <span class="material-symbols-outlined"> skip_previous </span>
          </KButton>
          <KButton round text class="hover-show" @click="store.currentIndex--">
            <span class="material-symbols-outlined"> skip_next </span>
          </KButton>
        </div>
        <p class="text-sm truncate hidden sm:block">{{ store.currentSong.name }}</p>
      </div>
      <div class="flex flex-col justify-center text-right min-w-0">
        <p class="text-xs truncate">{{ currentLyricLine?.text }}</p>
        <p v-if="currentLyricLine?.translation" class="text-xs! truncate">
          {{ currentLyricLine?.translation }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.material-symbols-outlined {
  @apply text-sm! leading-none;
}
.hover-show {
  @apply hidden;
}
#music-bar {
  @apply hover:[&>img]:block;
  @apply hover:[&_#main]:flex-col-reverse hover:[&_#main]:items-start;
  @apply hover:[&_.hover-show]:flex;
  @apply transition-all duration-300;
}
</style>
