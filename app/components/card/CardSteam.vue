<script setup lang="ts">
import type { Steam } from '~/scripts/statusTypes';

const props = defineProps<{
  steam: Steam;
}>();

const stateKey = computed(() => {
  const key = props.steam.personaState;
  if (key < 0 || key > 6) return 'steam.state-offline';
  return `steam.state-${key}`;
});

const profileLink = computed(() => {
  if (!props.steam.personaName) return '';
  return `https://steamcommunity.com/id/${props.steam.personaName}`;
});

const gameLink = computed(() => {
  if (!props.steam.gameId) return '';
  return `https://store.steampowered.com/app/${props.steam.gameId}`;
});
</script>

<template>
  <KCard title="Steam" class="min-w-[25%]">
    <div class="flex flex-col gap-2">
      <div class="flex justify-between gap-2">
        <span>{{ $t('steam.name') }}</span>
        <a :href="profileLink" target="_blank" class="link">{{ steam.personaName }}</a>
      </div>
      <div class="flex justify-between gap-2">
        <span>{{ $t('steam.status') }}</span>
        <span>{{ $t(stateKey) }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span>{{ $t('steam.playing') }}</span>
        <a v-if="steam.gameExtraInfo" :href="gameLink" target="_blank" class="link">
          {{ steam.gameExtraInfo }}
        </a>
        <span v-else>{{ $t('steam.not-playing') }}</span>
      </div>
    </div>
  </KCard>
</template>
