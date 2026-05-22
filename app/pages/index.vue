<script setup lang="ts">
const config = useAppConfig();
</script>

<template>
  <AppPage>
    <div class="h-[20vh] flex items-center justify-center">
      <h1 class="text-2xl font-bold">你好，欢迎来到 Kuriyona's Space</h1>
    </div>
    <div class="flex justify-center gap-4 max-[400px]:flex-col">
      <KCard :title="$t('about.about-me')">
        <p>{{ $t('about.hello-i-am-kuriyona') }}</p>
        <p>{{ $t('about.also-weixi-yona') }}</p>
        <br />
        <p class="font-bold">{{ $t('about.description') }}</p>
      </KCard>
      <KCard :title="$t('about.info')">
        <KTable>
          <tbody class="bg-transparent">
            <tr>
              <th>名字</th>
              <td>未晞</td>
            </tr>
            <tr>
              <th>生日</th>
              <td>{{ config.info.birth }}</td>
            </tr>
            <tr>
              <th>MBTI</th>
              <td>{{ config.info.mbti }}</td>
            </tr>
            <tr>
              <th>身高</th>
              <td>{{ config.info.height }} cm</td>
            </tr>
          </tbody>
        </KTable>
      </KCard>
    </div>
    <div class="flex justify-center gap-2 max-[400px]:flex-col">
      <KCard :title="'未晞所在地'">
        <img class="h-20" src="https://r2.kuriyona.com/static/image/site/location-map.png" />
      </KCard>
      <KCard :title="'未晞所在地天气'">
        <CardWeather />
      </KCard>
    </div>
  </AppPage>
</template>
