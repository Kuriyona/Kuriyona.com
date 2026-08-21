<script setup lang="ts">
import QRCode from 'qrcode.vue';

const config = useAppConfig();

type Contact = {
  name: string;
  i18nKey?: string;
  value?: string;
  link?: string;
  icon?: string;
  mdIcon?: string;
  qr?: string;
  qrOnly?: boolean;
  group?: string;
};

const groupOrder = ['social', 'contact'];

const groups = computed(() => {
  const map = new Map<string, Contact[]>();
  for (const item of config.contact as Contact[]) {
    const g = item.group || 'social';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(item);
  }
  return groupOrder.filter((g) => map.has(g)).map((g) => ({ key: g, items: map.get(g)! }));
});

const activeQr = ref<Contact | null>(null);
const showQr = computed({
  get: () => !!activeQr.value,
  set: (v) => {
    if (!v) activeQr.value = null;
  },
});

const cardClass =
  'flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 backdrop-blur-sm hover:bg-white/5 transition-colors duration-300 cursor-pointer min-w-0 sm:gap-3 sm:px-4 sm:py-3 sm:min-w-[160px]';
</script>

<template>
  <KCard v-for="group in groups" :key="group.key" :title="$t(`about.contact-group.${group.key}`)">
    <div class="flex flex-wrap gap-3 justify-center">
      <template v-for="link in group.items" :key="link.name">
        <a :href="link.link" target="_blank" :class="cardClass">
          <span
            v-if="link.mdIcon"
            class="material-symbols-outlined text-lg! leading-none sm:text-2xl">
            mail
          </span>
          <img
            v-if="link.icon"
            class="w-4 h-4 sm:w-6 sm:h-6"
            :alt="link.name"
            :src="`https://cdn.simpleicons.org/${link.icon}/white`" />
          <div class="flex flex-col items-center min-w-0 sm:items-start">
            <span class="text-xs font-semibold sm:text-sm">
              {{ link.i18nKey ? $t(link.i18nKey) : link.name }}
            </span>
            <span
              v-if="link.value"
              class="hidden text-xs text-white/50 truncate max-w-full sm:block"
              >{{ link.value }}</span
            >
          </div>
          <KIconButton
            v-if="link.qr || link.qrOnly"
            icon="qr_code"
            size="base"
            icon-class="sm:text-lg"
            class="ml-auto shrink-0 sm:ml-1"
            @click.prevent.stop="activeQr = link" />
        </a>
      </template>
    </div>
  </KCard>

  <KDialog v-model="showQr" width="max-w-sm">
    <template #title>
      <span v-if="activeQr?.mdIcon" class="material-symbols-outlined"> mail </span>
      <img
        v-if="activeQr?.icon"
        class="w-5 h-5"
        :alt="activeQr?.name"
        :src="`https://cdn.simpleicons.org/${activeQr.icon}/white`" />
      <span class="truncate">{{ activeQr?.i18nKey ? $t(activeQr.i18nKey) : activeQr?.name }}</span>
    </template>
    <div class="flex flex-col items-center gap-3">
      <QRCode
        :value="activeQr?.qr || activeQr?.link || ''"
        class="w-40 h-40 bg-white p-2 rounded-lg" />
      <p v-if="activeQr?.value" class="text-xs text-white/50">{{ activeQr.value }}</p>
    </div>
  </KDialog>
</template>
