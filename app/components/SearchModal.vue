<script setup lang="ts">
import { useSearch } from '~/composables/useSearch';

const s = reactive(useSearch());

const inputRef = ref<HTMLInputElement | null>(null);

const resultEls = ref<HTMLElement[]>([]);

watch(
  () => s.visible,
  (v) => {
    if (v) nextTick(() => inputRef.value?.focus());
  },
);

watch(
  () => s.activeIndex,
  (i) => {
    if (i >= 0) resultEls.value[i]?.scrollIntoView({ block: 'center' });
  },
);

function onBackdropClick() {
  s.close();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    s.close();
    return;
  }
  s.onKeydown(e);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="s.visible" class="search-modal fixed inset-0 z-9999 flex justify-center bg-black/50">
      <div class="search-modal-backdrop fixed inset-0" @click="onBackdropClick" />

      <KCard
        class="search-modal-container relative mt-[10vh] h-fit max-h-[85vh] w-full max-w-150 mx-4 flex flex-col gap-2">
        <div class="search-modal-input-wrap flex items-center gap-2">
          <var-input
            ref="inputRef"
            v-model="s.query"
            class="search-modal-input flex-1 min-w-0 outline-none"
            placeholder="Search..."
            @input="s.onInput()"
            @keydown="onKeydown"
            clearable
            @clear="s.clear" />
        </div>

        <KCard v-if="s.loading" class="search-modal-loading">Searching...</KCard>

        <KCard v-else-if="s.error" class="search-modal-error">
          {{ s.error }}
        </KCard>

        <KCard v-else-if="s.query.length >= 1 && s.results.length === 0" class="search-modal-empty">
          No results found
        </KCard>

        <div
          v-else-if="s.flatResults.length"
          class="search-modal-results overflow-y-auto p-2 flex flex-col gap-2">
          <KCard
            v-for="(item, i) in s.flatResults"
            :key="item.url"
            :ref="
              (el: any) => {
                if (el) resultEls[i] = el.$el ?? el;
              }
            "
            :class="{ 'is-active': i === s.activeIndex, 'is-sub': item.depth === 1 }"
            class="search-modal-result-item shadow-white/10"
            :style="
              item.depth === 1 ? { marginLeft: '12px', fontSize: '12px !important' } : undefined
            ">
            <a :href="item.url" class="search-modal-result-link block" @click="s.close()">
              <div class="search-modal-result-title">{{ item.title }}</div>
              <div class="search-modal-result-excerpt" v-html="item.excerpt" />
            </a>
          </KCard>
        </div>
      </KCard>
    </div>
  </Teleport>
</template>

<style lang="css" scoped>
.is-active {
  outline: 2px solid var(--color-theme);
}
</style>
