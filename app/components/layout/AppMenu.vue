<script setup lang="ts">
import dayjs from 'dayjs';
import { useSearch } from '~/composables/useSearch';

const open = defineModel<boolean>();
const nav = useNav();

// <md 时顶栏的搜索按钮收进这里（同一个「更多」按钮），见下方 narrow 区块。
// 搜索：先关抽屉再开搜索框（SearchModal 是 Teleport 的独立浮层，层级更高，不会被抽屉遮住）。
const search = useSearch();
function openSearch() {
  open.value = false;
  search.open();
}

// 窄视口判定（与 Tailwind 的 md = 48rem 对齐）：抽屉里只在窄视口渲染搜索入口。
// 音乐不放抽屉：<md 没有音乐入口，≥md 走顶栏胶囊 → MusicPanel。
const narrow = ref(false);
let narrowQuery: MediaQueryList | null = null;
function syncNarrow() {
  if (narrowQuery) narrow.value = narrowQuery.matches;
}
onMounted(() => {
  narrowQuery = window.matchMedia('(width < 48rem)');
  syncNarrow();
  narrowQuery.addEventListener('change', syncNarrow);
});
onBeforeUnmount(() => narrowQuery?.removeEventListener('change', syncNarrow));

// 抽屉打开时锁住页面滚动（见 usePageScrollLock；不能用 reka 的 useBodyScrollLock，
// 它会把 body 的 pointer-events 设成 none，整页点不动）
const scrollLocked = ref(false);
usePageScrollLock(scrollLocked);
watch(
  open,
  (value) => {
    if (value) scrollLocked.value = true;
  },
  { immediate: true },
);
// 关闭动画期间先保持锁定，滑出结束再解锁，免得滚动条闪回、页面抖一下
const unlock = () => (scrollLocked.value = false);

const { locale, locales, setLocale } = useI18n();
const language = computed({
  get: () => locale.value,
  set: (code: string) => {
    setLocale(code);
    open.value = false;
  },
});
const localeOptions = computed(() => locales.value.map((l) => ({ value: l.code, label: l.name })));

const gitHash = GIT_HASH;
const buildTime = BUILD_TIME;
const { currentNodeName } = useCloudflareStatus();
</script>

<template>
  <Transition name="menu" @after-leave="unlock">
    <div v-if="open">
      <div
        class="k-scrim fixed left-0 top-0 z-[110] w-screen h-dvh select-none"
        @mousedown.prevent
        @click="open = false" />
      <KSurface
        as="aside"
        glass
        class="fixed w-80 max-[400px]:w-screen right-0 top-0 z-[110] h-dvh flex flex-col gap-4 p-4 overflow-y-auto">
        <div class="flex justify-end">
          <KIconButton icon="material-symbols:close" @click="open = false" />
        </div>
        <!-- <md：顶栏的搜索按钮并入这个「更多」按钮，功能搬进抽屉。
             ≥md 顶栏自己有搜索入口，抽屉里不再重复。音乐不在抽屉里：<md 没有音乐入口（设计如此），
             ≥md 走顶栏胶囊 → MusicPanel。 -->
        <div v-if="narrow" class="flex flex-col gap-2">
          <KDivider :label="$t('global.search')" />
          <button
            type="button"
            class="k-interactive flex items-center gap-3 rounded-lg border border-(--color-control-border) bg-(--color-control-bg) px-3 py-2 text-left"
            @click="openSearch">
            <KIcon name="material-symbols:search" class="text-lg" />
            <span class="flex-1 truncate text-sm text-(--color-text-2)">
              {{ $t('global.search') }}
            </span>
            <KIcon name="material-symbols:arrow-forward" class="text-(--color-text-3)" />
          </button>
        </div>
        <div class="flex flex-col gap-2">
          <KDivider :label="$t('global.language-settings')" />
          <KSelect
            v-model="language"
            :options="localeOptions"
            :placeholder="$t('global.language')" />
        </div>
        <div class="flex flex-col gap-2">
          <KDivider :label="$t('global.pages')" />
          <KCardLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            @click="open = false"
            :text="item.shortTitle || item.title"
            :desc="item.desc || undefined" />
        </div>
        <div class="flex flex-col gap-2 mt-auto">
          <KDivider :label="$t('global.about')" />
          <div class="flex flex-col gap-1 text-sm text-(--color-text-2) font-monos">
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
            <p>
              <a href="https://icp.gov.moe/?keyword=20266280" target="_blank" class="link">
                萌 ICP 备 20266280 号
              </a>
            </p>
          </div>
        </div>
      </KSurface>
    </div>
  </Transition>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.25s ease;
}
.menu-enter-active > :last-child,
.menu-leave-active > :last-child {
  transition: transform 0.25s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
.menu-enter-from > :last-child,
.menu-leave-to > :last-child {
  transform: translateX(100%);
}
</style>
