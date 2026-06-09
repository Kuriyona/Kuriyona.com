<script setup lang="ts">
import ky from 'ky';
type SongDetail = {
  id: number;
  name: string;
  artists: {
    id: number;
    name: string;
  }[];
  album: {
    id: number;
    name: string;
    picUrl: string;
  };
  duration: number;
};

interface Lyric {
  lines: LyricLine[];
}
export type LyricLine = {
  time: number;
  text: string;
  translation?: string;
};

const { data: song } = useAsyncData('song', async () => {
  return await ky(
    'https://r2.kuriyona.com/static/163-music/song-detail/442016694.json',
  ).json<SongDetail>();
});
const { data: lyric } = useAsyncData('lyric', async () => {
  return await ky('https://r2.kuriyona.com/static/163-music/lyric/442016694.json').json<Lyric>();
});
const url = computed(() => {
  if (song.value?.id === 442016694) {
    return 'https://r2.kuriyona.com/static/163-music/song/442016694.mp3';
  }
  return `https://meting.20100907.xyz/api?server=netease&type=url&id=${song.value?.id}`;
});
const cover = computed(() => song.value?.album?.picUrl + '?param=64x64');
const audio = useTemplateRef<HTMLAudioElement>('audio');
const { playing, currentTime } = useMediaControls(audio);
const currentLyric = computed(() => {
  const index = (lyric.value?.lines.findIndex((line) => line.time >= currentTime.value) ?? 1) - 1;
  return lyric.value?.lines[index];
});
</script>

<template>
  <div
    v-if="song"
    id="music-bar"
    class="h-10 hover:h-16 flex items-center gap-2 text-nowrap truncate">
    <audio ref="audio" :src="url"></audio>
    <img :src="cover" class="h-full hidden" />
    <div class="flex justify-between w-full">
      <div id="main" class="flex items-center gap-1 min-w-0 h-fit">
        <div class="flex items-center">
          <KButton round text @click="playing = !playing">
            <span class="material-symbols-outlined">
              {{ playing ? 'pause' : 'play_arrow' }}
            </span>
          </KButton>
          <KButton round text class="hover-show">
            <span class="material-symbols-outlined"> skip_previous </span>
          </KButton>
          <KButton round text class="hover-show">
            <span class="material-symbols-outlined"> skip_next </span>
          </KButton>
        </div>
        <p class="text-sm truncate hidden sm:block">{{ song?.name }}</p>
      </div>
      <div class="flex flex-col justify-center text-right min-w-0">
        <p class="text-xs truncate">{{ currentLyric?.text }}</p>
        <p v-if="currentLyric?.translation" class="text-xs! truncate">
          {{ currentLyric?.translation }}
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
