import ky from 'ky';
import type { Lyric, PlaylistDetails, SongDetail } from '~/utils/types/music';

const getSongDetail = async (id: number) => {
  return await ky(
    `https://r2.kuriyona.com/static/163-music/song-detail/${id}.json`,
  ).json<SongDetail>();
};

const getLyric = async (id: number) => {
  return await ky(`https://r2.kuriyona.com/static/163-music/lyric/${id}.json`).json<Lyric>();
};

export const useMusicStore = defineStore('music', () => {
  const playlist = ref<PlaylistDetails>();
  const details = ref<Record<number, SongDetail>>({});
  const lyrics = ref<Record<number, Lyric>>({});

  ky('https://r2.kuriyona.com/static/163-music/playlist/18007101553.json')
    .json<PlaylistDetails>()
    .then((res) => {
      playlist.value = res;
      currentIndex.value = playlist.value.songs.length - 1;
    });

  const currentIndex = ref<number>(-1);
  const currentSongId = ref<number>();
  const currentSong = ref<SongDetail>();
  const currentLyric = computed(() => {
    if (!currentSongId.value) {
      return undefined;
    }
    return lyrics.value[currentSongId.value];
  });

  watch(currentIndex, (newVal) => {
    console.log(newVal);
    if (!playlist.value) {
      return;
    }
    if (newVal < 0) {
      currentIndex.value = playlist.value?.songs.length - 1;
    }
    if (newVal >= playlist.value?.songs.length) {
      currentIndex.value = 0;
    }
    currentSongId.value = playlist.value?.songs[currentIndex.value]!.id;
  });

  watch(currentSongId, async (newVal) => {
    if (newVal) {
      const song = await getSongDetail(newVal);
      details.value[newVal] = song;
      currentSong.value = song;
      const lyric = await getLyric(newVal);
      lyrics.value[newVal] = lyric;
    }
  });

  return { playlist, currentSong, currentLyric, currentIndex };
});
