<script setup lang="ts">
import type { Weather } from './types';

const weather = ref<Weather>();

onMounted(() => {
  fetchApi.get('/weather').then(async (res) => {
    weather.value = await res.json<Weather>();
  });
});
</script>

<template>
  <div class="flex flex-col max-[600px]:flex-row max-[600px]:gap-4">
    <KTable v-if="weather">
      <tbody class="bg-transparent">
        <tr>
          <th>{{ $t('weather.weather') }}</th>
          <td>
            <span class="flex justify-end gap-1">
              <i :class="`qi-${weather.now.icon}`"></i>
              <span>{{ weather.now.text }}</span>
            </span>
          </td>
        </tr>
        <tr>
          <th>{{ $t('weather.temp') }}</th>
          <td>{{ weather.now.temp }}℃</td>
        </tr>
        <tr>
          <th>{{ $t('weather.feels-like') }}</th>
          <td>{{ weather.now.feelsLike }}℃</td>
        </tr>
        <tr>
          <th>{{ $t('weather.humidity') }}</th>
          <td>{{ weather.now.humidity }}%</td>
        </tr>
      </tbody>
    </KTable>
    <KTable v-if="weather">
      <tbody class="bg-transparent">
        <tr>
          <th>{{ $t('weather.wind-speed') }}</th>
          <td>{{ weather.now.windSpeed }} m/s</td>
        </tr>
        <tr>
          <th>{{ $t('weather.wind-dir') }}</th>
          <td>{{ weather.now.windDir }}</td>
        </tr>
        <tr>
          <th>{{ $t('weather.cloud') }}</th>
          <td>{{ weather.now.cloud }}%</td>
        </tr>
        <tr>
          <th>{{ $t('weather.vis') }}</th>
          <td>{{ weather.now.vis }} km</td>
        </tr>
      </tbody>
    </KTable>
  </div>
</template>
