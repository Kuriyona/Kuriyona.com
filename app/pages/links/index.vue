<script setup lang="ts">
const config = useAppConfig();
const mainStore = useMainStore();
const showTurnstile = ref(false);
const dialog = ref(false);
const form = ref({
  url: 'https://',
  title: '',
  desc: '',
  avatar: 'https://',
  contact: '',
});
const formRef = useTemplateRef('formRef');
const regUrl = /^https:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/[^\s]*)?$/;
const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) {
    return;
  }
  fetchApi
    .post('/links/request', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${mainStore.jwt}`,
      },
      body: JSON.stringify(form.value),
    })
    .then(() => {
      Snackbar.success('友链申请已提交');
    });
};
useSeoMeta({ title: $t('about.links.title') });
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/about">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h1 class="text-2xl">{{ $t('about.links.title') }}</h1>
    <KCard :title="$t('about.links.best-friends')">
      <div class="flex flex-col gap-2">
        <KCardLink
          v-for="link in config.links.main"
          level
          :to="link.url"
          :text="link.title"
          :img="link.avatar"
          :new="true" />
      </div>
    </KCard>
    <KCard :title="$t('about.links.other-friends')">
      <div class="grid grid-cols-1 md:grid-cols-2 content-stretch gap-2">
        <KCardLink
          v-for="link in config.links.others"
          level
          :to="link.url"
          :text="link.title"
          :desc="link.desc"
          :img="link.avatar"
          :new="true" />
      </div>
    </KCard>
    <KCard :title="$t('about.links.title')">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        <KCardLink
          v-for="link in config.links.links"
          level
          :to="link.url"
          :text="link.title"
          :desc="link.desc"
          :img="link.avatar"
          :new="true" />
      </div>
    </KCard>
    <KCard :title="$t('about.links.exchange')">
      <div class="font-mono text-wrap break-all">
        <p>url : https://kuriyona.com</p>
        <p>title : Kuriyona's Space</p>
        <p>desc : {{ $t('about.description') }}</p>
        <p>avatar : https://r2.kuriyona.com/img/avatar/Avatar_256.png</p>
      </div>
      <br />
      <KButton level block round @click="dialog = true">
        {{ $t('global.submit') }}
      </KButton>
      <var-dialog
        v-model:show="dialog"
        :confirm-button="false"
        :cancel-button="false"
        :title="$t('global.submit')">
        <var-form ref="formRef"
          >       
          <div class="flex flex-col gap-2">
            <var-input
              v-model="form.url"
              placeholder="url"
              :rules="(value) => regUrl.test(value) || 'Invalid URL'" />
            <var-input
              v-model="form.title"
              placeholder="title"
              :rules="(value) => value.trim() !== '' || 'Invalid Title'" />
            <var-input v-model="form.desc" placeholder="desc" />
            <var-input
              v-model="form.avatar"
              placeholder="avatar"
              :rules="(value) => regUrl.test(value) || 'Invalid Avatar URL'" />
            <var-input v-model="form.contact" placeholder="我怎么联系您" />
            <template v-if="!mainStore.jwt">
              <var-alert> {{ $t('turnstile.please-verify') }} </var-alert>
              <var-button @click="showTurnstile = true" block>
                {{ $t('global.start') }}
              </var-button>
            </template>
            <var-button level="danger" @click="dialog = false">
              {{ $t('global.cancel') }}
            </var-button>
            <var-button v-if="mainStore.jwt" type="primary" level="primary" @click="handleSubmit">
              {{ $t('global.submit') }}
            </var-button>
            <KTurnstile v-model:show="showTurnstile" />
          </div>
        </var-form>
      </var-dialog>
    </KCard>
  </AppPage>
</template>
