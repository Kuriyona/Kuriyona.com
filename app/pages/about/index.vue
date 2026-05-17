<script setup lang="ts">
import Config from '@/config.json';
import dayjs from 'dayjs';

useSeoMeta({ title: $t('about.about-me') });
</script>

<template>
  <Page class="gap-6">
    <IAm />
    <var-divider :description="$t('about.about-me')" />
    <p>{{ $t('about.hello-i-am-kuriyona') }}</p>
    <p>{{ $t('about.description') }}</p>
    <p>{{ $t('about.also-weixi-yona') }}</p>
    <ClientOnly>
      <p>
        {{
          $t('about.days_on_earth', [
            dayjs().diff('2008/6/28', 'year'),
            dayjs().diff('2008/6/28', 'month'),
            dayjs().diff('2008/6/28', 'day'),
          ])
        }}
      </p>
      <Weather />
    </ClientOnly>
    <CardLink to="/blog" :text="$t('blog.title')" />
    <CardLink
      to="/blog/about-name"
      :text="`${$t('global.read_more')} | 「${$t('about.about-my-name')}」`" />
    <CardLink to="/about/as-mtf">
      <template #content>
        <span class="trans-text">
          {{ $t('global.read_more') }} | 「{{ $t('about.mtf.as-mtf') }}」
        </span>
      </template>
    </CardLink>
    <var-divider :description="$t('about.skills')" />
    <div class="flex gap-2 flex-wrap justify-center">
      <img
        v-for="item in Config.tech_stack"
        :key="item.name"
        :alt="item.name"
        :src="`https://img.shields.io/badge/${encodeURIComponent(item.name)}-black?style=for-the-badge&logo=${item.icon}`" />
    </div>
    <div class="flex gap-2 flex-wrap justify-center">
      <img
        v-for="item in Config.languages"
        :key="item.name"
        :alt="$t(item.name)"
        :src="`https://img.shields.io/badge/${item.icon}-${$t(item.name)}-black?style=for-the-badge`" />
    </div>
    <var-divider description="CONTACT" />
    <div class="flex flex-wrap gap-2 justify-center">
      <CardLink
        v-for="link in Config.contact"
        :key="link.name"
        :to="link.link"
        :text="link.value"
        :new="true">
        <div class="flex items-center gap-4">
          <span v-if="link.mdIcon" class="material-symbols-outlined"> mail </span>
          <img
            v-if="link.icon"
            class="w-4 h-4"
            :src="`https://cdn.simpleicons.org/${link.icon}/white`" />
          <span>{{ link.i18nKey ? $t(link.i18nKey) : link.name }}</span>
        </div>
      </CardLink>
    </div>
    <var-divider :description="$t('about.links')" />
    <CardLink
      v-for="link in Config.links.main"
      :to="link.url"
      :text="link.title"
      :img="link.avatar"
      :new="true" />
    <CardLink to="/links" :text="$t('more')" />
  </Page>
</template>
