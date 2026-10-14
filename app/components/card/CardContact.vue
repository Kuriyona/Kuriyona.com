<script setup lang="ts">
import QRCode from 'qrcode.vue';

const config = useAppConfig();

type Contact = {
  name: string;
  i18nKey?: string;
  /** 账号等资料，仅作记录，不在首页展示 */
  value?: string;
  link?: string;
  /** iconify 全名（simple-icons:<slug>） */
  icon?: string;
  /** iconify 全名（material-symbols:<name>） */
  mdIcon?: string;
  /** 二维码内容（缺省时用 link） */
  qr?: string;
  /** link 无法直接访问（如微信），只能扫码：tile 退化为按钮 */
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

/** 可跳转 → 外链 a；qrOnly（链接无效）→ button，点击直接开二维码 */
const tileProps = (item: Contact) =>
  item.link && !item.qrOnly
    ? { as: 'a', href: item.link, target: '_blank', rel: 'noopener noreferrer' }
    : { as: 'button', type: 'button', onClick: () => (activeQr.value = item) };
</script>

<template>
  <KCard v-for="group in groups" :key="group.key" :title="$t(`about.contact-group.${group.key}`)">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <div v-for="item in group.items" :key="item.name" class="relative">
        <KSurface
          v-bind="tileProps(item)"
          class="k-interactive flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl px-2 py-4 text-center">
          <KIcon
            :name="item.mdIcon || item.icon || 'material-symbols:link'"
            class="text-2xl text-(--color-text-1)" />
          <span class="text-xs text-(--color-text-2) sm:text-sm">
            {{ item.i18nKey ? $t(item.i18nKey) : item.name }}
          </span>
        </KSurface>
        <KIconButton
          v-if="item.qr || item.qrOnly"
          icon="material-symbols:qr-code"
          size="sm"
          class="absolute right-1 top-1"
          :label="`${item.i18nKey ? $t(item.i18nKey) : item.name} · ${$t('about.contact-qr')}`"
          @click="activeQr = item" />
      </div>
    </div>
  </KCard>

  <KDialog v-model="showQr" width="max-w-xs">
    <template #title>
      <KIcon v-if="activeQr?.mdIcon" :name="activeQr.mdIcon" />
      <KIcon v-if="activeQr?.icon" :name="activeQr.icon" class="text-xl" />
      <span class="truncate">{{ activeQr?.i18nKey ? $t(activeQr.i18nKey) : activeQr?.name }}</span>
    </template>
    <div class="flex flex-col items-center gap-3">
      <div class="rounded-lg bg-white p-3">
        <QRCode
          :value="activeQr?.qr || activeQr?.link || ''"
          render-as="svg"
          :size="160"
          :margin="2"
          class="block" />
      </div>
    </div>
  </KDialog>
</template>
