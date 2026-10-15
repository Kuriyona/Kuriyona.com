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
  loadPlaylist,
  playAt,
  toggle,
  next,
  prev,
  seek,
} = useMusic();

onMounted(() => void loadPlaylist());

// 播放失败（上游没给直链 / 音频加载失败）→ toast 一次；同一 key 连续失败靠 id 区分
watch(error, (value) => {
  if (value) toast.error(t(value.key));
});

const onSeek = (event: Event) => seek(Number((event.target as HTMLInputElement).value));
</script>

<template>
  <KCard :title="$t('music.title')">
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

    <div class="mt-3 flex items-center gap-2 text-xs tabular-nums text-(--color-text-3)">
      <span>{{ formatDuration(position) }}</span>
      <input
        type="range"
        class="min-w-0 flex-1 cursor-pointer accent-(--color-theme) disabled:opacity-50"
        min="0"
        :max="current?.duration ?? 0"
        :value="position"
        :disabled="!current"
        :aria-label="$t('music.progress')"
        @input="onSeek" />
      <span>{{ formatDuration(current?.duration ?? 0) }}</span>
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
  </KCard>
</template>
