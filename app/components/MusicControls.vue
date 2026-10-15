<script setup lang="ts">
import { toast } from '~/composables/useToast';

const { t } = useI18n();

const {
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
} = useMusic();

// 只显示当前这一句（没有歌词时 lyricIndex 为 -1，取不到）
const currentLyric = computed(() => lyric.value[lyricIndex.value] ?? null);

onMounted(() => void loadPlaylist());

// 播放失败（上游没给直链 / 音频加载失败）→ toast 一次；同一 key 连续失败靠 id 区分。
// consumeError 是单例里的去重：保留区卡片与窄视口面板可能各挂一份 MusicControls，只让先到的那个弹。
watch(error, (value) => {
  if (value && consumeError(value.id)) toast.error(t(value.key));
});

const total = computed(() => current.value?.duration ?? 0);
/** 已播百分比 = 进度条内色块宽度 */
const percent = computed(() => (total.value > 0 ? (position.value / total.value) * 100 : 0));

/** 改进度后给进度条一个短暂的「回弹」动画 */
const seeking = ref(false);
let seekTimer: ReturnType<typeof setTimeout> | undefined;

const applySeek = (ms: number) => {
  if (!total.value) return;
  seek(Math.min(total.value, Math.max(0, ms)));
  seeking.value = true;
  clearTimeout(seekTimer);
  seekTimer = setTimeout(() => (seeking.value = false), 200);
};

const onBarClick = (event: MouseEvent) => {
  const { left, width } = (event.currentTarget as HTMLElement).getBoundingClientRect();
  if (!width) return;
  applySeek(((event.clientX - left) / width) * total.value);
};

// 原来用 <input type="range"> 自带键盘操作，换成 div 后手动补上
const onBarKey = (event: KeyboardEvent) => {
  const step = 5000;
  const keys: Record<string, number | undefined> = {
    ArrowRight: position.value + step,
    ArrowLeft: position.value - step,
    Home: 0,
    End: total.value,
  };
  const target = keys[event.key];
  if (target === undefined) return;
  event.preventDefault();
  applySeek(target);
};

onUnmounted(() => clearTimeout(seekTimer));
</script>

<template>
  <div class="flex items-center gap-3">
    <img
      v-if="current?.coverUrl"
      :src="current.coverUrl"
      alt=""
      class="size-12 shrink-0 rounded-lg object-cover" />
    <div
      v-else
      class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-(--color-control-bg) text-(--color-text-4)">
      <KIcon name="material-symbols:music-note" class="text-xl" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate">{{ current?.name ?? '—' }}</p>
      <p class="truncate text-xs text-(--color-text-3)">
        {{ current?.artists.join(' / ') ?? '—' }}
      </p>
    </div>
  </div>

  <!-- 歌词：固定 2 行高（当前句 / 翻译），没有翻译时那行留空，切行不跳高度 -->
  <div class="mt-3 flex h-8 flex-col justify-center text-center text-xs leading-4">
    <template v-if="currentLyric">
      <p class="truncate font-bold">{{ currentLyric.text }}</p>
      <p class="truncate text-(--color-text-3)">{{ currentLyric.translation ?? '' }}</p>
    </template>
    <p v-else-if="!lyric.length" class="text-(--color-text-3)">
      {{ current ? $t('music.no-lyric') : '—' }}
    </p>
  </div>

  <!-- 进度：第一行进度条（点击改变进度），第二行左已播 / 右总时长 -->
  <div
    class="mt-3 flex h-4 items-center"
    :class="{ 'opacity-50': !current }"
    role="slider"
    :tabindex="current ? 0 : -1"
    :aria-label="$t('music.progress')"
    aria-valuemin="0"
    :aria-valuemax="total"
    :aria-valuenow="position"
    :aria-disabled="!current"
    @click="onBarClick"
    @keydown="onBarKey">
    <div
      class="w-full overflow-hidden rounded-full bg-(--color-control-bg) transition-[height] duration-200 ease-out"
      :class="[{ 'hover:h-2.5': current }, seeking ? 'h-2.5' : 'h-1.5']">
      <div
        class="h-full rounded-full bg-(--color-theme) transition-[width] duration-200 ease-out"
        :style="{ width: `${percent}%` }" />
    </div>
  </div>

  <div class="mt-1 flex items-center justify-between text-xs tabular-nums text-(--color-text-3)">
    <span>{{ formatDuration(position) }}</span>
    <span>{{ formatDuration(total) }}</span>
  </div>

  <div class="mt-2 flex items-center justify-center gap-1">
    <KIconButton
      icon="material-symbols:skip-previous"
      size="base"
      :label="$t('music.prev')"
      :disabled="!current"
      class="disabled:opacity-50"
      @click="prev" />
    <KIconButton
      :icon="playing ? 'material-symbols:pause' : 'material-symbols:play-arrow'"
      :label="playing ? $t('music.pause') : $t('music.play')"
      :disabled="!current"
      class="disabled:opacity-50"
      @click="toggle" />
    <KIconButton
      icon="material-symbols:skip-next"
      size="base"
      :label="$t('music.next')"
      :disabled="!current"
      class="disabled:opacity-50"
      @click="next" />
  </div>

  <ul v-if="tracks.length" class="mt-3 flex max-h-40 flex-col gap-1 overflow-y-auto">
    <li v-for="(track, i) in tracks" :key="track.id">
      <button
        type="button"
        class="k-interactive flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left"
        :class="i === index ? 'bg-(--color-hover) font-bold' : ''"
        @click="playAt(i)">
        <span class="min-w-0 flex-1 truncate">{{ track.name }}</span>
        <span class="shrink-0 text-xs tabular-nums text-(--color-text-3)">
          {{ formatDuration(track.duration) }}
        </span>
      </button>
    </li>
  </ul>

  <p v-if="state === 'error'" class="text-(--color-text-3)">{{ $t('music.load-error') }}</p>
  <p v-else-if="state === 'ready' && !tracks.length" class="text-(--color-text-3)">
    {{ $t('music.empty') }}
  </p>
</template>
