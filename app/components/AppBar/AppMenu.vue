<script setup lang="ts">
import dayjs from 'dayjs';

const show = defineModel<boolean>();
const nav = useNav();

const gitHash = GIT_HASH;
const buildTime = BUILD_TIME;
const { currentNodeName } = useCloudflareStatus();
</script>

<template>
  <Transition name="menu">
    <div v-if="show">
      <div class="fixed left-0 top-0 z-[110] w-screen h-dvh bg-black/50" @click="show = false" />
      <div
        class="fixed w-80 max-[400px]:w-screen right-0 top-0 z-[110] h-dvh bg-white/2 border-l border-white/5 flex flex-col gap-4 p-4 overflow-y-auto backdrop-blur-3xl">
        <div class="flex justify-end">
          <KIconButton icon="close" @click="show = false" />
        </div>
        <KCardLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          @click="show = false"
          :text="item.shortTitle || item.title"
          :desc="item.desc || undefined" />
        <KDivider class="mt-auto" />
        <div class="flex flex-col gap-1 text-xs text-white/60 font-monos">
          <p>
            {{ $t('global.opensource') }} (MIT) :
            <a href="https://github.com/Kuriyona/Kuriyona.com" target="_blank" class="link">
              Kuriyona/Kuriyona.com
            </a>
            <a
              :href="`https://github.com/Kuriyona/Kuriyona.com/commit/${gitHash}`"
              target="_blank"
              class="link ml-1">
              {{ gitHash }}
            </a>
          </p>
          <p>
            {{ $t('global.build-time') }} : {{ dayjs(buildTime).format('YYYY-MM-DD HH:mm:ss') }}
          </p>
          <p v-if="currentNodeName">{{ $t('app.using-cf') }} : {{ currentNodeName }}</p>
        </div>
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
