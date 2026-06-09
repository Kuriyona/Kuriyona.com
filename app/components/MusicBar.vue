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
const cover = computed(() => song.value?.album?.picUrl);
const audio = useTemplateRef<HTMLAudioElement>('audio');
const { playing, currentTime } = useMediaControls(audio);
const currentLyric = computed(() => {
  const index = (lyric.value?.lines.findIndex((line) => line.time >= currentTime.value) ?? 1) - 1;
  return lyric.value?.lines[index];
});
</script>

<template>
  <div v-if="song" class="h-16 flex items-center justify-between gap-2">
    <audio ref="audio" :src="url"></audio>
    <!-- <img :src="cover" class="h-3/4 rounded-md" /> -->
    <div class="flex items-center gap-2">
      <KButton round text @click="playing = !playing">
        <span class="material-symbols-outlined text-sm!">
          {{ playing ? 'pause' : 'play_arrow' }}
        </span>
      </KButton>
      <p class="text-sm">{{ song?.name }}</p>
    </div>
    <div class="flex flex-col gap-0.5 text-right">
      <p class="text-xs">{{ currentLyric?.text }}</p>
      <p v-if="currentLyric?.translation" class="text-xs">{{ currentLyric?.translation }}</p>
    </div>
  </div>
</template>
