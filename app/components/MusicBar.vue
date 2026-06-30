<script setup lang="ts">
const store = useMusicStore();

const handleProgressClick = (event: MouseEvent) => {
  if (!store.currentSong) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = clickX / rect.width;
  const newTime = percentage * store.currentSong.duration;
  store.setCurrentTime(newTime / 1000);
};
</script>

<template>
  <div
    v-if="store.currentSong"
    id="music-bar"
    class="h-10 flex hover:h-16 items-center gap-2 text-nowrap truncate">
    <img :src="store.cover" class="h-full hidden" />
    <div class="flex justify-between w-full gap-2">
      <div id="main" class="flex items-center gap-1 min-w-0 h-fit w-full max-sm:w-fit max-w-[40%]">
        <div class="flex items-center">
          <KButton round text @click="store.playing = !store.playing">
            <span class="material-symbols-outlined">
              {{ store.playing ? 'pause' : 'play_arrow' }}
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
        <div class="w-full flex-col gap-1 hidden sm:flex">
          <p id="name" class="text-sm truncate">{{ store.currentSong.name }}</p>
          <div
            id="progress"
            class="h-0.5 bg-white/25 transition-all duration-300 rounded-full"
            @click="handleProgressClick">
            <div
              class="h-full bg-white/50 transition-width duration-100"
              :style="{
                width: `${(store.currentTime / store.currentSong.duration) * 100 * 1000}%`,
              }"></div>
          </div>
        </div>
      </div>
      <div class="flex flex-col justify-center text-right min-w-0 w-full">
        <p class="text-xs truncate">{{ store.currentLyricLine?.text }}</p>
        <p v-if="store.currentLyricLine?.translation" class="text-xs! truncate">
          {{ store.currentLyricLine?.translation }}
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
  @apply hover:sm:[&>img]:block;
  @apply hover:[&_#main]:flex-col-reverse hover:[&_#main]:items-start;
  @apply hover:[&_.hover-show]:flex;
  @apply hover:[&_#progress]:h-1;
  @apply transition-all duration-300;
}
</style>
