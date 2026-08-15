<script setup lang="ts">
import QRCode from 'qrcode.vue';
const config = useAppConfig();
</script>

<template>
  <KCard :title="$t('about.find-me')">
    <div class="hidden sm:flex flex-wrap gap-2 justify-center">
      <div v-for="link in config.contact" :key="link.name" class="relative group">
        <KCardLink
          level
          :to="!link.qrOnly ? link.link : undefined"
          :text="link.value"
          :new="true">
          <div class="flex items-center gap-2">
            <span v-if="link.mdIcon" class="material-symbols-outlined"> mail </span>
            <img
              v-if="link.icon"
              class="w-4 h-4"
              :src="`https://cdn.simpleicons.org/${link.icon}/white`" />
            <div class="flex flex-col items-start">
              <span>{{ link.i18nKey ? $t(link.i18nKey) : link.name }}</span>
              <span v-if="link.value" class="text-xs text-white/50">{{ link.value }}</span>
            </div>
          </div>
        </KCardLink>
        <div
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-xl bg-black/80 backdrop-blur-md shadow-lg shadow-black/40 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
          <div class="flex flex-col items-center gap-1">
            <QRCode :value="link.link" class="w-16 h-16" />
            <p>{{ link.value }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="flex sm:hidden flex-wrap gap-2 justify-center">
      <KCardLink
        v-for="link in config.contact.filter((item) => item.icon && item.name != 'WeChat')"
        level
        :key="link.name"
        :to="!link.qrOnly ? link.link : undefined"
        :text="link.value"
        :new="true"
        class="">
        <div class="flex items-center gap-2">
          <span v-if="link.mdIcon" class="material-symbols-outlined"> mail </span>
          <img
            v-if="link.icon"
            class="w-4 h-4"
            :src="`https://cdn.simpleicons.org/${link.icon}/white`" />
        </div>
      </KCardLink>
    </div>
  </KCard>
</template>
