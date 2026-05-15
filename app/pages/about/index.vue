<script setup lang="ts">
import Config from '@/config.json';
import { Alert } from '@varlet/ui';

const { locale } = useI18n();
</script>

<template>
  <Page>
    <IAm />
    <var-alert type="warning" :message="$t('global.in-dev')" />
    <p>{{ $t('about.hello-i-am-kuriyona') }}</p>
    <p>{{ $t('about.also-weixi-yona') }}</p>
    <p>{{ $t('about.about-kuriyona-name') }}</p>
    <p>{{ $t('about.about-weixi-name') }}</p>
    <var-divider :description="$t('tech_stack')" />
    <div class="flex gap-2 flex-wrap">
      <img
        v-for="item in Config.tech_stack"
        :key="item.name"
        :alt="item.name"
        :src="`https://img.shields.io/badge/${encodeURIComponent(item.name)}-black?style=for-the-badge&logo=${item.icon}`" />
    </div>
    <var-divider :description="$t('about.mtf.as-mtf')" />
    <CardLink to="/about/as-mtf" :text="$t('global.read_more')" />
    <var-divider v-if="false" description="CONTACT" />
    <div v-if="false">
      <CardLink
        v-for="link in Config.contact"
        :key="link.name"
        :to="link.link"
        :text="link.value"
        :new="true">
        <div>
          <img
            height="32"
            width="32"
            :src="`https://unpkg.com/simple-icons@v16/icons/${link.icon}.svg`" />
        </div>
      </CardLink>
    </div>
  </Page>
</template>
