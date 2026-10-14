<script setup lang="ts">
const { data: status } = useStatus();
</script>

<template>
  <AppPage>
    <CardSteam v-if="status?.steam" :steam="status?.steam" />
    <div class="flex justify-center gap-4 max-[900px]:flex-col">
      <CardCityMap
        v-if="status?.cities"
        class="flex-1"
        :title="$t('about.city-resident')"
        :city="status.cities.resident" />
      <CardCityMap
        v-if="status?.cities"
        class="flex-1"
        :title="$t('about.city-current')"
        :city="status.cities.current" />
      <CardWeather v-if="status?.weather" :weather="status?.weather" />
    </div>
    <CardGithub v-if="status?.github_activity" :github_activity="status?.github_activity" />
  </AppPage>
</template>
