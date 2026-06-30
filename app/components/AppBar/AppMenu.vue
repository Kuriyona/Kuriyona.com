<script setup lang="ts">
import BackgroundSelector from '../AppBar/BackgroundSelector.vue';
const { setLocale, locales } = useI18n();
const show = defineModel<boolean>();
const emit = defineEmits(['open-neko']);
</script>

<template>
  <Transition name="menu">
    <div v-if="show">
      <div class="fixed right-0 top-0 w-screen h-screen bg-black/25" @click="show = false" />
      <div
        class="fixed w-80 max-w-[95vw] right-0 top-0 h-screen bg-black/50 backdrop-blur-sm border-l border-white/5 flex flex-col gap-4 p-4 overflow-visible">
        <div class="flex justify-end">
          <KButton round @click="show = false">
            <span class="material-symbols-outlined text-lg! leading-none"> close </span>
          </KButton>
        </div>
        <KCardLink to="/blog" @click="show = false" text="Blog" shadow />
        <KCardLink
          @click="
            emit('open-neko');
            show = false;
          "
          text="Neko"
          shadow />
        <KCardLink @click="show = false" text="Ask Box" shadow />
        <KCard shadow :title="$t('global.language')">
          <div class="flex flex-col gap-2">
            <KButton
              v-for="locale in locales"
              :key="locale.code"
              block
              shadow
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
