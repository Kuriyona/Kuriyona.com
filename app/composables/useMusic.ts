import type { MusicPlaylist, MusicTrack } from '@/scripts/musicTypes';

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

let audio: HTMLAudioElement | null = null;
/** 当前已装进 audio 的曲目下标（-1 = 还没装）；用于「暂停后继续」不重新拉直链 */
let loadedIndex = -1;
let failId = 0;

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
    tracks.value = data.tracks;
    state.value = 'ready';
  } catch {
    state.value = 'error';
  }
}

/** 切到第 target 首并开始播放；拿不到可播地址（outer 链接回 404/不可播）只发失败通知，不自动跳过，避免连环 toast */
function playAt(target: number) {
  const track = tracks.value[target];
  if (!track) return;
  index.value = target;
  position.value = 0;
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
  return {
    tracks,
    state,
    index,
    playing,
    position,
    error,
    current,
    loadPlaylist,
    playAt,
    toggle,
    next,
    prev,
    seek,
  };
}
