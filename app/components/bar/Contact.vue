<script setup lang="ts">
const config = useAppConfig();
</script>

<template>
  <KCard :title="$t('about.find-me')">
    <div class="flex flex-wrap gap-2 justify-center">
      <var-tooltip v-for="link in config.contact">
        <KCardLink
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
            <div class="flex flex-col items-start">
              <span>{{ link.i18nKey ? $t(link.i18nKey) : link.name }}</span>
              <span v-if="link.value" class="text-xs text-white/50">{{ link.value }}</span>
            </div>
          </div>
        </KCardLink>
        <template #content>
          <div class="flex flex-col items-center gap-1">
            <QRCode :value="link.link" class="w-16 h-16" />
            <p>{{ link.value }}</p>
          </div>
        </template>
      </var-tooltip>
    </div>
  </KCard>
</template>
