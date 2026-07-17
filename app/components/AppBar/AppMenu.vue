<script setup lang="ts">
const store = useMusicStore();
import BackgroundSelector from '../AppBar/BackgroundSelector.vue';
const { setLocale, locales } = useI18n();
const show = defineModel<boolean>();
const emit = defineEmits(['open-neko']);
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
  <Transition name="menu">
    <div v-if="show">
      <div class="fixed left-0 top-0 w-screen h-dvh bg-black/50" @click="show = false" />
      <div
        class="fixed w-80 max-[400px]:w-screen right-0 top-0 h-dvh bg-white/2 border-l border-white/5 flex flex-col gap-4 p-4 overflow-y-auto backdrop-blur-3xl">
        <div class="flex justify-end">
          <KButton round @click="show = false">
            <span class="material-symbols-outlined text-lg! leading-none"> close </span>
          </KButton>
        </div>
        <KCard v-if="store.currentSong">
          <div class="flex items-center gap-2 overflow-x-hidden">
            <img :src="store.cover" class="h-16 w-16 rounded-md" />
            <div class="relative w-full flex flex-col items-center gap-2">
              <p id="name" class="text-center w-full text-sm">
                {{ store.currentSong.name }}
              </p>
              <div class="flex items-center gap-4">
                <KButton round text class="hover-show" @click="store.currentIndex++">
                  <span class="material-symbols-outlined text-sm! leading-none">
                    skip_previous
                  </span>
                </KButton>
                <KButton round text @click="store.playing = !store.playing">
                  <span class="material-symbols-outlined text-sm! leading-none">
                    {{ store.playing ? 'pause' : 'play_arrow' }}
                  </span>
                </KButton>
                <KButton round text class="hover-show" @click="store.currentIndex--">
                  <span class="material-symbols-outlined text-sm! leading-none"> skip_next </span>
                </KButton>
              </div>
            </div>
          </div>
          <div class="mt-2 flex justify-between">
            <span>{{ formatDuration(store.currentTime * 1000) }}</span>
            <span>{{ formatDuration(store.currentSong.duration) }}</span>
          </div>
          <div
            id="progress"
            class="mt-0.5 h-1 bg-white/25 transition-all duration-300 rounded-full"
            @click="handleProgressClick">
            <div
              class="h-full bg-white/50 transition-width duration-100"
              :style="{
                width: `${(store.currentTime / store.currentSong.duration) * 100 * 1000}%`,
              }"></div>
          </div>
        </KCard>
        <KCardLink to="/blog" @click="show = false" text="Blog" />
        <KCardLink to="/blog" @click="show = false" text="Neko" />
        <KCardLink to="/blog" @click="show = false" :text="$t('status.title')" />
        <KCardLink to="/ask-box" @click="show = false" :text="$t('ask-box.title')" />
        <KCard :title="$t('global.language')">
          <div class="flex flex-col gap-2">
            <KButton
              v-for="locale in locales"
              :key="locale.code"
              block
              @click="
                setLocale(locale.code);
                show = false;
              "
              class="text-xs"
              >{{ locale.name }}
            </KButton>
          </div>
        </KCard>
        <BackgroundSelector />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.25s ease;
}
.menu-enter-active > div:last-child,
.menu-leave-active > div:last-child {
  transition: transform 0.25s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
.menu-enter-from > div:last-child,
.menu-leave-to > div:last-child {
  transform: translateX(100%);
}
</style>
