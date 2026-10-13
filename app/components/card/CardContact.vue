<script setup lang="ts">
import QRCode from 'qrcode.vue';

const config = useAppConfig();

type Contact = {
  name: string;
  i18nKey?: string;
  value?: string;
  link?: string;
  /** iconify 全名（simple-icons:<slug>） */
  icon?: string;
  /** iconify 全名（material-symbols:<name>） */
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
</script>

<template>
  <KCard v-for="group in groups" :key="group.key" :title="$t(`about.contact-group.${group.key}`)">
    <div class="flex flex-wrap gap-3 justify-center">
      <template v-for="link in group.items" :key="link.name">
        <KSurface
          as="a"
          :href="link.link"
          target="_blank"
          class="k-interactive flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer min-w-0 sm:gap-3 sm:px-4 sm:py-3 sm:min-w-[160px]">
          <KIcon v-if="link.mdIcon" :name="link.mdIcon" class="text-lg sm:text-2xl" />
          <KIcon v-if="link.icon" :name="link.icon" class="text-base sm:text-2xl" />
          <div class="flex flex-col items-center min-w-0 sm:items-start">
            <span class="text-xs font-semibold sm:text-sm">
              {{ link.i18nKey ? $t(link.i18nKey) : link.name }}
            </span>
            <span
              v-if="link.value"
              class="hidden text-xs text-(--color-text-3) truncate max-w-full sm:block"
              >{{ link.value }}</span
            >
          </div>
          <KIconButton
            v-if="link.qr || link.qrOnly"
            icon="material-symbols:qr-code"
            size="base"
            icon-class="sm:text-lg"
            class="ml-auto shrink-0 sm:ml-1"
            @click.prevent.stop="activeQr = link" />
        </KSurface>
      </template>
    </div>
  </KCard>

  <KDialog v-model="showQr" width="max-w-sm">
    <template #title>
      <KIcon v-if="activeQr?.mdIcon" :name="activeQr.mdIcon" />
      <KIcon v-if="activeQr?.icon" :name="activeQr.icon" class="text-xl" />
      <span class="truncate">{{ activeQr?.i18nKey ? $t(activeQr.i18nKey) : activeQr?.name }}</span>
    </template>
    <div class="flex flex-col items-center gap-3">
      <QRCode
        :value="activeQr?.qr || activeQr?.link || ''"
        class="w-40 h-40 bg-white p-2 rounded-lg" />
      <p v-if="activeQr?.value" class="text-xs text-(--color-text-3)">{{ activeQr.value }}</p>
    </div>
  </KDialog>
</template>
