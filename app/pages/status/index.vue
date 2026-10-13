<script setup lang="ts">
const { status, cities } = useCityMaps('status');
</script>

<template>
  <AppPage>
    <CardSteam v-if="status?.steam" :steam="status.steam" />
    <div class="flex justify-center gap-4 max-[900px]:flex-col">
      <CardCityMap
        v-if="cities"
        class="flex-1"
        :title="$t('about.city-resident')"
        :city="cities.resident" />
      <CardCityMap
        v-if="cities"
        class="flex-1"
        :title="$t('about.city-current')"
        :city="cities.current" />
      <CardWeather v-if="status?.weather" :weather="status.weather" />
    </div>
    <CardGithub v-if="status?.github_activity" :github_activity="status.github_activity" />
  </AppPage>
</template>
