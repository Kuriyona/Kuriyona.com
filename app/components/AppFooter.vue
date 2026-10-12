<script setup lang="ts">
import dayjs from 'dayjs';
</script>

<template>
  <KCard>
    <div class="text-center font-monos">
      <p>
        {{ $t('global.copyright') }} © {{ dayjs().format('YYYY') }} Kuriyona. All rights reserved.
      </p>
      <p>
        <a href="https://icp.gov.moe/?keyword=20266280" target="_blank" class="link">
          萌 ICP 备 20266280 号
        </a>
      </p>
    </div>
  </KCard>
</template>
