<script lang="ts" setup>
const mainStore = useMainStore();
const showTurnstile = ref(false);

const { t } = useI18n();

const formRef = useTemplateRef('form');
const form = ref({
  name: '',
  showName: true,
  question: '',
  showIP: false,
  note: '',
});

const submit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) {
    return;
  }
  const res = await fetchApi.post('/ask-box', {
    headers: { 'Content-Type': 'application/json', Authorization: mainStore.jwt },
    body: JSON.stringify(form.value),
  });
  if (res.status === 200) {
    Snackbar.success(t('global.submit-success'));
  } else {
    Snackbar.error(t('global.submit-fail'));
  }
};

useSeoMeta({ title: `${t('ask-box.title')} - ${t('ask-box.ask-me')}` });
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/ask-box">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h2 class="text-xl font-bold">{{ t('ask-box.ask-me') }}</h2>
    <p>请在下方填写并提交你的问题，留下身份或者匿名都行的喵。</p>
    <KCard class="my-4">
      <var-form ref="form" class="flex flex-col gap-4">
        <var-input placeholder="昵称（可选）" v-model="form.name" variant="outlined" />
        <var-input
          placeholder="问题（支持 Markdown）"
          :rules="(e) => e.trim().length > 0 || '请输入文本（'"
          textarea
          v-model="form.question"
          variant="outlined" />
        <var-input placeholder="备注（可选/不公开）" v-model="form.note" variant="outlined" />
        <p class="mt-2 flex items-center justify-between">
          <span>公开展示昵称：</span> <var-switch v-model="form.showName" />
        </p>
        <p class="flex items-center justify-between">
          <span>公开展示 IP 属地：</span> <var-switch v-model="form.showIP" />
        </p>
        <KTurnstile v-model:show="showTurnstile" />
        <KButton v-if="!mainStore.jwt" @click="showTurnstile = true" block>
          {{ $t('turnstile.please-verify') }}
        </KButton>
        <KButton v-if="mainStore.jwt" type="primary" block @click="submit">
          {{ $t('global.submit') }}
        </KButton>
      </var-form>
    </KCard>
  </AppPage>
</template>
