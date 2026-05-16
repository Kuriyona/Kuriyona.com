<script setup lang="ts">
import dayjs from 'dayjs';
const gitHash = GIT_HASH;
const buildTime = BUILD_TIME;
</script>

<template>
  <Card>
    <div class="text-center font-mono">
      <p>
        {{ $t('opensource') }} (MIT) :
        <var-link href="https://github.com/Kuriyona/Kuriyona.com" target="_blank">
          Kuriyona/Kuriyona.com
        </var-link>
        <span>&nbsp;</span>
        <var-link
          :href="`https://github.com/Kuriyona/Kuriyona.com/commit/${gitHash}`"
          target="_blank">
          {{ gitHash }}
        </var-link>
      </p>
      <p>{{ $t('copyright') }} © {{ dayjs().format('YYYY') }} Kuriyona. All rights reserved.</p>
      <p>{{ $t('global.build-time') }} : {{ dayjs(buildTime).format('YYYY-MM-DD HH:mm:ss') }}</p>
      <p>
        <var-link href="https://icp.gov.moe/?keyword=20266280" target="_blank">
          萌 ICP 备 20266280 号
        </var-link>
      </p>
    </div>
  </Card>
</template>
