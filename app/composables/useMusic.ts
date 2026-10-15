import type { MusicLyric, MusicLyricLine, MusicPlaylist, MusicTrack } from '@/scripts/musicTypes';

type MusicState = 'idle' | 'loading' | 'ready' | 'error';

// 播放地址不经过后端：网易的 outer 链接会 302 到 CDN 直链，浏览器自己跟随。
// 必须用 https —— 站点是 https，写成 http 会被当混合内容直接拦掉。
const outerUrl = (id: number) => `https://music.163.com/song/media/outer/url?id=${id}.mp3`;

const tracks = ref<MusicTrack[]>([]);
const state = ref<MusicState>('idle');
const index = ref(0);
const playing = ref(false);
const position = ref(0);
/** 播放失败通知：值是 i18n key，组件 watch 到新 id 就 toast 一次 */
const error = ref<{ id: number; key: string } | null>(null);
/** 当前曲目歌词（含逐行翻译），随 playAt 切换；无歌词为空数组 */
const lyric = ref<MusicLyricLine[]>([]);
/** 歌词按曲目 id 记忆（空结果也记），同一首重播不再请求；HTTP 层另有长期缓存 */
const lyricCache = new Map<number, MusicLyricLine[]>();

let audio: HTMLAudioElement | null = null;
/** 当前已装进 audio 的曲目下标（-1 = 还没装）；用于「暂停后继续」不重新拉直链 */
let loadedIndex = -1;
let failId = 0;
/** 同一次失败只提示一次：MusicControls 可能同时挂两份（左保留区卡片 + 窄视口悬浮面板） */
let notifiedErrorId = 0;
const consumeError = (id: number) => {
  if (id === notifiedErrorId) return false;
  notifiedErrorId = id;
  return true;
};

const fail = (key: string) => {
  failId += 1;
  error.value = { id: failId, key };
  playing.value = false;
};

const ensureAudio = () => {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'auto';
  audio.addEventListener('play', () => {
    playing.value = true;
  });
  audio.addEventListener('pause', () => {
    playing.value = false;
  });
  audio.addEventListener('timeupdate', () => {
    position.value = Math.round(audio!.currentTime * 1000);
  });
  audio.addEventListener('ended', () => void next());
  audio.addEventListener('error', () => fail('music.unavailable'));
  return audio;
};

/** 首次挂载时拉一次歌单；state 不为 idle 说明已加载/加载中，路由切换不会重复请求 */
async function loadPlaylist() {
  if (state.value !== 'idle') return;
  state.value = 'loading';
  try {
    const data = await (await fetchApi.get('/music/playlist')).json<MusicPlaylist>();
    // 每次加载都换个顺序（Fisher-Yates 原地洗牌），不落持久化
    tracks.value = [...data.tracks];
    for (let i = tracks.value.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [tracks.value[i], tracks.value[j]] = [tracks.value[j]!, tracks.value[i]!];
    }
    state.value = 'ready';
  } catch {
    state.value = 'error';
  }
}

/** 拉某首的歌词；失败只留空数组、不报错（歌词缺失不该影响播放），下次播放再试 */
async function loadLyric(id: number) {
  const cached = lyricCache.get(id);
  if (cached) {
    lyric.value = cached;
    return;
  }
  lyric.value = [];
  try {
    const data = await (await fetchApi.get(`/music/lyric?id=${id}`)).json<MusicLyric>();
    lyricCache.set(id, data.lines);
    // 请求期间可能已切歌：落地前确认还是当前这首
    if (tracks.value[index.value]?.id === id) lyric.value = data.lines;
  } catch {
    /* 忽略：无歌词 */
  }
}

/** 切到第 target 首并开始播放；拿不到可播地址（outer 链接回 404/不可播）只发失败通知，不自动跳过，避免连环 toast */
function playAt(target: number) {
  const track = tracks.value[target];
  if (!track) return;
  index.value = target;
  position.value = 0;
  void loadLyric(track.id);
  const el = ensureAudio();
  el.src = outerUrl(track.id);
  loadedIndex = target;
  void el.play().catch(() => fail('music.unavailable'));
}

function toggle() {
  if (playing.value) {
    audio?.pause();
    return;
  }
  // 暂停后继续：src 已经装好，别再重设一次（ended/error 后的 index 变化会走 playAt）
  if (audio && loadedIndex === index.value) {
    void audio.play().catch(() => fail('music.unavailable'));
    return;
  }
  playAt(index.value);
}

const next = () => playAt((index.value + 1) % Math.max(1, tracks.value.length));
const prev = () =>
  playAt((index.value - 1 + tracks.value.length) % Math.max(1, tracks.value.length));

const seek = (ms: number) => {
  if (!audio) return;
  audio.currentTime = ms / 1000;
  position.value = ms;
};

export function useMusic() {
  const current = computed(() => tracks.value[index.value] ?? null);
  /** 当前行下标：最后一个开始时间 ≤ 播放位置的行；还没唱到第一行（前奏）时为 -1 */
  const lyricIndex = computed(() => {
    const lines = lyric.value;
    let low = 0;
    let high = lines.length - 1;
    let found = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (lines[mid]!.time <= position.value) {
        found = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return found;
  });
  return {
    tracks,
    state,
    index,
    playing,
    position,
    error,
    current,
    lyric,
    lyricIndex,
    consumeError,
    loadPlaylist,
    playAt,
    toggle,
    next,
    prev,
    seek,
  };
}
