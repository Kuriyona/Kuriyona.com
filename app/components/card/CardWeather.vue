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
          <th>天气</th>
          <td>{{ weather.now.text }}</td>
        </tr>
        <tr>
          <th>温度</th>
          <td>{{ weather.now.temp }}℃</td>
        </tr>
        <tr>
          <th>体感</th>
          <td>{{ weather.now.feelsLike }}℃</td>
        </tr>
        <tr>
          <th>湿度</th>
          <td>{{ weather.now.humidity }}%</td>
        </tr>
      </tbody>
    </KTable>
    <KTable v-if="weather">
      <tbody class="bg-transparent">
        <tr>
          <th>风速</th>
          <td>{{ weather.now.windSpeed }} m/s</td>
        </tr>
        <tr>
          <th>风向</th>
          <td>{{ weather.now.windDir }}</td>
        </tr>
        <tr>
          <th>云量</th>
          <td>{{ weather.now.cloud }}%</td>
        </tr>
        <tr>
          <th>能见度</th>
          <td>{{ weather.now.vis }} km</td>
        </tr>
      </tbody>
    </KTable>
  </div>
</template>
