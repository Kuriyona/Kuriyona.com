<script setup lang="ts">
import type { Status } from '@/scripts/statusTypes';

const { data: status } = useAsyncData(
  'status',
  () =>
    fetchApi.get('/status').then(async (res) => {
      return await res.json<Status>();
    }),
  {
    server: false,
  },
);
</script>

<template>
  <AppPage>
    <CardSteam v-if="status?.steam" :steam="status?.steam" />
    <div class="flex justify-center gap-4 max-[600px]:flex-col">
      <KCard :title="$t('about.location')" class="flex-1">
        <div class="relative max-h-40 h-full w-full">
          <p
            class="absolute bottom-0 left-0 text-black/80 text-sm backdrop-blur-md p-1 rounded-tr-md">
            {{ $t('about.location-value') }}
          </p>
          <img
            class="h-full w-full object-cover max-[400px]:hidden"
            src="https://r2.kuriyona.com/static/image/site/location-map-600.png" />
          <img
            class="h-full w-full object-cover min-[400px]:hidden"
            src="https://r2.kuriyona.com/static/image/site/location-map-400.png" />
        </div>
      </KCard>
      <CardWeather v-if="status?.weather" :weather="status?.weather" />
    </div>
    <CardGithub v-if="status?.github_activity" :github_activity="status?.github_activity" />
  </AppPage>
</template>
