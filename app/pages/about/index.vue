<script setup lang="ts">
const config = useAppConfig();
const aboutNav = useAboutNav();
</script>

<template>
  <AppPage data-pagefind-body>
    <div class="py-4 flex flex-col items-center justify-center gap-4 text-center px-10 mb-10">
      <h1 class="text-2xl font-bold font-monos">
        <span>{{ $t('about.welcome-to') }}</span>
        <br />
        <span data-pagefind-meta="title">Kuriyona's Space</span>
      </h1>
    </div>
    <div class="flex justify-center gap-4 max-[600px]:flex-col">
      <KCard :title="$t('about.about-me')" class="flex-1">
        <p>{{ $t('about.hello-i-am-kuriyona') }}</p>
        <p>{{ $t('about.also-weixi-yona') }}</p>
        <p>
          <NuxtLinkLocale to="/blog/about-name" class="link">{{
            $t('about.about-my-name')
          }}</NuxtLinkLocale>
        </p>
        <br />
        <p class="font-bold">{{ $t('about.description') }}</p>
      </KCard>
      <CardInfo class="min-w-[25%]" />
    </div>
    <div class="grid grid-cols-1 min-[900px]:grid-cols-2 gap-4">
      <KCardLink v-for="item in aboutNav" :key="item.to" :to="item.to" class="min-h-28">
        <div class="w-full h-full flex flex-col gap-2">
          <div>
            <p
              :class="
                item.to === '/about/as-mtf' ? 'trans-text text-xl font-bold' : 'text-xl font-bold'
              ">
              {{ item.title }}
            </p>
            <p v-if="item.desc" class="text-sm text-white/50">{{ item.desc }}</p>
          </div>
          <div class="mt-auto flex justify-end">
            <span
              class="icon material-symbols-outlined text-white/40 transition-transform duration-300 group-hover:[&_.icon]:scale-100 [&_.icon]:scale-90">
              arrow_forward
            </span>
          </div>
        </div>
      </KCardLink>
    </div>
    <KCard :title="$t('about.skills')">
      <div class="flex gap-2 flex-wrap justify-center">
        <div
          v-for="item in config.tech_stack"
          :key="item.name"
          class="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 backdrop-blur-sm text-sm hover:bg-white/5 transition-colors duration-300">
          <img
            :src="`https://cdn.simpleicons.org/${item.icon}`"
            :alt="item.name"
            class="w-5 h-5 p-0.5 bg-white rounded-sm" />
          <span>{{ item.name }}</span>
        </div>
        <span class="hidden min-[600px]:block self-center w-px h-8 bg-white/10 mx-1"></span>
        <div
          v-for="item in config.languages"
          :key="item.name"
          class="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 backdrop-blur-sm text-sm hover:bg-white/5 transition-colors duration-300">
          <span
            class="px-1.5 py-0.5 bg-white rounded-sm text-[10px] font-bold text-black leading-none"
            >{{ item.icon }}</span
          >
          <span>{{ $t(item.name) }}</span>
        </div>
      </div>
    </KCard>
    <CardContact />
    <CardGames />
    <KCard :title="$t('about.links.title')">
      <div class="flex flex-col gap-2">
        <KCardLink
          v-for="link in config.links.main"
          level
          :to="link.url"
          :text="link.title"
          :img="link.avatar"
          :new="true" />
        <KCardLink level to="/links" :text="$t('global.more')" />
      </div>
    </KCard>
  </AppPage>
</template>
