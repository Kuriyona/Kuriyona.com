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
    <div
      v-if="s.visible"
      class="search-modal k-scrim fixed inset-0 z-9999 flex flex-col items-center">
      <div class="search-modal-backdrop fixed inset-0" @click="onBackdropClick" />

      <!-- 输入框不套卡片：单独浮在遮罩上（KInput 自带描边与 inset 底色） -->
      <KInput
        ref="inputRef"
        v-model="s.query"
        class="search-modal-input relative mt-[10vh] w-full max-w-150 shrink-0 mx-4"
        placeholder="Search..."
        @input="s.onInput()"
        @keydown="onKeydown"
        clearable
        @clear="s.clear" />

      <!-- 结果（含加载 / 出错 / 空态）统一装在一张卡里 -->
      <KCard
        v-if="
          s.loading ||
          s.error ||
          (s.query.length >= 1 && s.results.length === 0) ||
          s.flatResults.length
        "
        class="search-modal-results relative mt-2 mb-4 w-full max-w-150 max-h-[70vh] overflow-y-auto mx-4 flex flex-col gap-1 p-2">
        <p v-if="s.loading" class="search-modal-loading p-2 text-(--color-text-2)">
          Searching...
        </p>

        <p v-else-if="s.error" class="search-modal-error p-2 text-(--color-text-2)">
          {{ s.error }}
        </p>

        <p
          v-else-if="s.query.length >= 1 && s.results.length === 0"
          class="search-modal-empty p-2 text-(--color-text-2)">
          No results found
        </p>

        <template v-else>
          <a
            v-for="(item, i) in s.flatResults"
            :key="item.url"
            :ref="
              (el: any) => {
                if (el) resultEls[i] = el.$el ?? el;
              }
            "
            :class="{ 'is-active': i === s.activeIndex }"
            class="search-modal-result-item k-interactive block rounded-lg px-2 py-1.5"
            :style="item.depth === 1 ? { marginLeft: '12px', fontSize: '12px' } : undefined"
            :href="item.url"
            @click="s.close()">
            <div class="search-modal-result-title">{{ item.title }}</div>
            <div class="search-modal-result-excerpt" v-html="item.excerpt" />
          </a>
        </template>
      </KCard>
    </div>
  </Teleport>
</template>

<style lang="css" scoped>
/* 搜索浮层的遮罩比弹窗 / 抽屉更浅：下面的页面还要能看清 */
.search-modal {
  background-color: var(--color-scrim-soft);
}

.is-active {
  outline: 2px solid var(--color-theme);
  outline-offset: -2px;
}
</style>
