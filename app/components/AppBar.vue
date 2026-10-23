<script setup lang="ts">
import AppMenu from './AppBar/AppMenu.vue';
import KButton from './KButton.vue';
import { useSearch } from '~/composables/useSearch';
const mobileMenu = ref(false);
/** 窄视口的悬浮音乐面板（宽视口用左保留区的播放器，见模板里的 reserve:hidden） */
const musicPanel = ref(false);

const search = useSearch();
const { current, playing, toggle } = useMusic();

onMounted(() => {
  function globalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      search.toggle();
    }
  }
  document.addEventListener('keydown', globalKeydown);
});
</script>

<template>
  <div class="k-surface k-glass fixed w-screen top-0 z-100 flex justify-center">
    <div class="w-(--content-width) max-w-screen px-4 *:px-2 *:font-monos">
      <div class="relative min-h-12 py-2 px-3 flex justify-between items-center rounded-xl">
        <div class="h-full flex items-center gap-4">
          <img
            class="h-6 rounded-md hidden sm:inline-block"
            src="https://r2.kuriyona.com/img/avatar/Avatar_256.png" />
          <NuxtLinkLocale to="/">
            <span class="hover:underline">Kuriyona's Space</span>
          </NuxtLinkLocale>
        </div>
        <div id="actions" class="flex items-center gap-2">
          <KIconButton icon="material-symbols:search" @click="search.toggle()" />
          <!-- 复合音乐按钮：整体是一个胶囊，右端嵌一个更小的播放/暂停子按钮。
               点胶囊其他区域（含左端乐符）= 打开悬浮音乐面板；点子按钮 = 播放/暂停。
               只在窄视口出现（reserve: 断点以下）：宽视口左保留区已经有完整的播放器卡片。
               h-9（36px，border-box）= 两侧 KButton 的高度（p-2 + text-lg 图标 18px + 边框），
               不写死的话内容高度（size-6 子按钮 24px）撑出来只有 30px，会比左右两个按钮矮一截。
               pr-1.25（5px）= 内高 34 − 子按钮 24 = 上下各 5px，加边框后四周到子按钮都是 6px
               （左侧还有 gap-1.5 = 6px），子按钮才是正中的，不然右边只有 3px 会显偏。 -->
          <div
            class="k-interactive relative flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-(--color-control-border) bg-(--color-control-bg) pr-1.25 pl-2.5 text-(--color-text-1) reserve:hidden">
            <!-- 铺满整块的点击层（同时也是键盘入口）；子按钮叠在它上面，点到子按钮不会穿透到这里 -->
            <button
              type="button"
              class="absolute inset-0 rounded-full"
              :aria-label="$t('music.open-panel')"
              @click="musicPanel = true" />
            <KIcon name="material-symbols:music-note" class="pointer-events-none text-lg" />
            <button
              type="button"
              class="relative grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-theme)]/20 text-(--color-theme) disabled:opacity-50"
              :aria-label="playing ? $t('music.pause') : $t('music.play')"
              :disabled="!current"
              @click="toggle">
              <KIcon
                :name="playing ? 'material-symbols:pause' : 'material-symbols:play-arrow'"
                class="text-base" />
            </button>
          </div>
          <KButton round class="gap-2" :aria-label="$t('global.more')" @click="mobileMenu = true">
            <KIcon name="material-symbols:translate" class="text-lg" />
            <KIcon name="material-symbols:menu" class="text-lg" />
          </KButton>
        </div>
      </div>
    </div>
  </div>
  <AppMenu v-model="mobileMenu" />
  <MusicPanel v-model="musicPanel" />
  <SearchModal />
</template>
