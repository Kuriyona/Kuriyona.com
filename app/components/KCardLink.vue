<script setup lang="ts">
import { h } from 'vue';

const props = defineProps<{
  to?: string;
  text?: string;
  desc?: string;
  img?: string;
  new?: boolean;
  icon?: string;
  lang?: string;
}>();

const imgError = ref(false);

const LinkIcon = defineComponent({
  props: {
    new: Boolean,
    icon: String,
  },
  setup(p, { attrs }) {
    return () =>
      h(
        'span',
        { class: ['icon material-symbols-outlined', (attrs.class as string) ?? ''] },
        p.icon ?? (p.new ? 'open_in_new' : 'arrow_forward'),
      );
  },
});

const UrlPreview = defineComponent({
  props: {
    to: String,
    new: Boolean,
  },
  setup(p) {
    return () =>
      p.to && p.new
        ? h('p', { class: 'text-xs text-white/50 max-w-full truncate' }, p.to)
        : null;
  },
});
</script>

<template>
  <NuxtLinkLocale
    :to="props.to"
    :locale="props.lang as any"
    :target="props.new ? '_blank' : '_self'"
    class="hover:[&_.icon]:scale-100 [&_.icon]:scale-90 [&_.icon]:transition-transform [&_.icon]:duration-300">
    <KCard
      class="hover:bg-white/5 transition-bg duration-300 h-full flex flex-col justify-center"
      v-bind="$attrs">
      <slot
        :to="props.to"
        :text="props.text"
        :desc="props.desc"
        :img="props.img"
        :new="!!props.new"
        :icon="props.icon"
        :LinkIcon="LinkIcon"
        :UrlPreview="UrlPreview">
        <div class="flex justify-between items-center w-full overflow-hidden">
          <div class="flex items-center gap-4 min-w-0">
            <template v-if="img">
              <img
                v-if="!imgError"
                @error="imgError = true"
                :src="img"
                class="w-8 h-8 rounded-2xl" />
              <span v-else class="material-symbols-outlined"> block </span>
            </template>
            <div class="max-w-full">
              <p>{{ props.text }}</p>
              <p v-if="props.desc" class="text-sm text-white/50">{{ props.desc }}</p>
              <component :is="UrlPreview" :to="props.to" :new="props.new" />
            </div>
          </div>
          <component :is="LinkIcon" :new="props.new" :icon="props.icon" />
        </div>
      </slot>
    </KCard>
  </NuxtLinkLocale>
</template>
