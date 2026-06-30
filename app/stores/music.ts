import ky from 'ky';
import { Howl, Howler } from 'howler';
import type { Lyric, PlaylistDetails, SongDetail } from '~/utils/types/music';

const API_BASE = 'https://r2.kuriyona.com/static/163-music';
const METING_API = 'https://meting.20100907.xyz/api';

const getSongDetail = (id: number) => ky(`${API_BASE}/song-detail/${id}.json`).json<SongDetail>();

const getLyric = (id: number) => ky(`${API_BASE}/lyric/${id}.json`).json<Lyric>();

const getSongUrl = async (id: number) => {
  if (id === 442016694) {
    return `${API_BASE}/song/442016694.mp3`;
  }
  const res = await ky(`${METING_API}?server=netease&type=url&id=${id}`);
  return res.url;
};

export const useMusicStore = defineStore('music', () => {
  const playlist = ref<PlaylistDetails>();
  const details = ref<Record<number, SongDetail>>({});
  const lyrics = ref<Record<number, Lyric>>({});
  const audioMap = ref(new Map<number, Howl>());

  const currentIndex = ref(-1);
  const currentSongId = ref(-1);
  const currentSong = ref<SongDetail>();
  const playing = ref(false);
  const currentTime = ref(0);
  const currentAudioId = ref<number>();

  const cover = computed(() => currentSong.value?.album?.picUrl + '?param=64x64');

  (async () => {
    const res = await ky(`${API_BASE}/playlist/18007101553.json`).json<PlaylistDetails>();
    playlist.value = res;
    currentIndex.value = playlist.value.songs.length - 1;
    const songEntries = await Promise.all(
      playlist.value.songs.map(async (song) => {
        const url = await getSongUrl(song.id);
        return [song.id, new Howl({ src: [url] })] as const;
      }),
    );
    audioMap.value = new Map(songEntries);
  })();

  let rafId: number | null = null;
  const updateTime = () => {
    if (playing.value && currentSongId.value !== -1) {
      const howl = audioMap.value.get(currentSongId.value);
      if (howl) {
        currentTime.value = howl.seek() || 0;
      }
    }
    rafId = requestAnimationFrame(updateTime);
  };

  onNuxtReady(() => {
    updateTime();
  });

  const setCurrentTime = (time: number) => {
    currentTime.value = time;
    audioMap.value.get(currentSongId.value)?.seek(time);
  };

  const currentLyric = computed(() => {
    if (currentSongId.value === -1) return undefined;
    return lyrics.value[currentSongId.value];
  });

  const currentLyricLine = computed(() => {
    const lyric = currentLyric.value;
    if (!lyric) return undefined;
    const lines = lyric.lines;
    const index = (lines.findIndex((line) => line.time >= currentTime.value) || 1) - 1;
    return lines[index];
  });

  watch(playing, (newVal) => {
    const howl = audioMap.value.get(currentSongId.value);
    if (!howl) {
      if (newVal) playing.value = false;
      return;
    }
    if (newVal) {
      currentAudioId.value = howl.play();
      if (!currentAudioId.value) {
        playing.value = false;
      }
    } else {
      howl.pause();
    }
  });

  watch(
    currentIndex,
    (newVal) => {
      if (!playlist.value) return;
      const len = playlist.value.songs.length;
      if (newVal < 0) {
        currentIndex.value = len - 1;
      } else if (newVal >= len) {
        currentIndex.value = 0;
      }
      if (currentIndex.value >= 0 && currentIndex.value < len) {
        currentSongId.value = playlist.value.songs[currentIndex.value]!.id;
      }
    },
    { immediate: true },
  );

  watch(currentSongId, async (newVal) => {
    if (newVal === -1) return;
    playing.value = false;
    Howler.stop();
    const [song, lyric] = await Promise.all([getSongDetail(newVal), getLyric(newVal)]);
    details.value[newVal] = song;
    currentSong.value = song;
    lyrics.value[newVal] = lyric;
    await nextTick();
    playing.value = true;
  });

  return {
    cover,
    playing,
    currentTime,
    setCurrentTime,
    currentLyricLine,
    currentAudioId,
    playlist,
    currentSong,
    currentLyric,
    currentIndex,
  };
});
