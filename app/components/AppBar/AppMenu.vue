<script setup lang="ts">
import dayjs from 'dayjs';

const show = defineModel<boolean>();
const nav = useNav();

// 抽屉打开时锁住页面滚动（见 usePageScrollLock；不能用 reka 的 useBodyScrollLock，
// 它会把 body 的 pointer-events 设成 none，整页点不动）
const scrollLocked = ref(false);
usePageScrollLock(scrollLocked);
watch(
  show,
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
    show.value = false;
  },
});
const localeOptions = computed(() => locales.value.map((l) => ({ value: l.code, label: l.name })));

const gitHash = GIT_HASH;
const buildTime = BUILD_TIME;
const { currentNodeName } = useCloudflareStatus();
</script>

<template>
  <Transition name="menu" @after-leave="unlock">
    <div v-if="show">
      <div
        class="k-scrim fixed left-0 top-0 z-[110] w-screen h-dvh select-none"
        @mousedown.prevent
        @click="show = false" />
      <KSurface
        as="aside"
        glass
        class="fixed w-80 max-[400px]:w-screen right-0 top-0 z-[110] h-dvh flex flex-col gap-4 p-4 overflow-y-auto">
        <div class="flex justify-end">
          <KIconButton icon="material-symbols:close" @click="show = false" />
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
            @click="show = false"
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
