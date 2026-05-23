<script setup lang="ts">
import dayjs from 'dayjs';
const gitHash = GIT_HASH;
const buildTime = BUILD_TIME;

const { currentNodeName, location } = useCloudflareStatus();
</script>

<template>
  <KCard>
    <div class="text-center font-mono">
      <p>
        {{ $t('opensource') }} (MIT) :
        <a href="https://github.com/Kuriyona/Kuriyona.com" target="_blank" class="underline"
          >Kuriyona/Kuriyona.com</a
        >
        <span>&nbsp;</span>
        <a
          :href="`https://github.com/Kuriyona/Kuriyona.com/commit/${gitHash}`"
          target="_blank"
          class="underline">
          {{ gitHash }}
        </a>
      </p>
      <p>{{ $t('copyright') }} © {{ dayjs().format('YYYY') }} Kuriyona. All rights reserved.</p>
      <p>{{ $t('global.build-time') }} : {{ dayjs(buildTime).format('YYYY-MM-DD HH:mm:ss') }}</p>
      <p>
        <a href="https://icp.gov.moe/?keyword=20266280" target="_blank" class="underline">
          萌 ICP 备 20266280 号
        </a>
      </p>
      <p v-if="currentNodeName">
        <span>{{ $t('app.using-cf') }}</span>
        <span>&nbsp;:&nbsp;{{ currentNodeName }}&nbsp;|&nbsp;{{ location }}</span>
      </p>
    </div>
  </KCard>
</template>
