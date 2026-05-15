<script setup lang="ts">
import dayjs from 'dayjs';
</script>

<template>
  <div>
    <p>
      · {{ $t('opensource') }} (MIT) :
      <a href="https://github.com/Kuriyona/Kuriyona.com" class="link-style">
        Kuriyona/Kuriyona.com
      </a>
    </p>
    <p>· {{ $t('copyright') }} © {{ dayjs().format('YYYY') }} Kuriyona. All rights reserved.</p>
    <p>
      <span>·&nbsp;</span>
      <a href="https://icp.gov.moe/?keyword=20266280" target="_blank" class="link-style">
        萌 ICP 备 20266280 号
      </a>
    </p>
  </div>
</template>
