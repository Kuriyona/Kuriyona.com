<script setup lang="ts">
import dayjs from 'dayjs';
</script>

<template>
  <var-card>
    <div class="text-center">
      <p>
        {{ $t('opensource') }} (MIT) :
        <var-link href="https://github.com/Kuriyona/Kuriyona.com" target="_blank">
          Kuriyona/Kuriyona.com
        </var-link>
      </p>
      <p>{{ $t('copyright') }} © {{ dayjs().format('YYYY') }} Kuriyona. All rights reserved.</p>
      <p>
        <var-link href="https://icp.gov.moe/?keyword=20266280" target="_blank">
          萌 ICP 备 20266280 号
        </var-link>
      </p>
    </div>
  </var-card>
</template>
