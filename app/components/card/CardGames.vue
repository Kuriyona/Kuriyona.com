<script setup lang="ts">
const config = useAppConfig();
</script>

<template>
  <KCard :title="$t('about.games.title')">
    <div class="w-full flex gap-2 overflow-x-auto flex-nowrap *:shrink-0 p-2">
      <KCardLink level v-for="game in config.games" :to="game.link" :new="true">
        <div class="flex flex-col items-center gap-1">
          <img :src="game.img" class="h-16 rounded-md" />
          <span>{{ game.name || $t(game?.i18nKey || '') }}</span>
        </div>
      </KCardLink>
    </div>
  </KCard>
</template>
