<script lang="ts" setup>
const mainStore = useMainStore();

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
    <h2 class="text-xl font-bold">{{ $t('ask-box.ask-me') }}</h2>
    <p>{{ $t('ask-box.ask-tip') }}</p>
    <KCard class="my-4">
      <var-form ref="form" class="flex flex-col gap-4">
        <var-input
          :placeholder="$t('ask-box.placeholder.nickname')"
          v-model="form.name"
          variant="outlined" />
        <var-input
          :placeholder="$t('ask-box.placeholder.question')"
          :rules="(e) => e.trim().length > 0 || '请输入文本（'"
          textarea
          v-model="form.question"
          variant="outlined" />
        <var-input
          :placeholder="$t('ask-box.placeholder.note')"
          v-model="form.note"
          variant="outlined" />
        <p class="mt-2 flex items-center justify-between">
          <span>{{ $t('ask-box.publish-nickname') }}</span> <var-switch v-model="form.showName" />
        </p>
        <KTurnstile />
        <KButton v-if="mainStore.jwt" type="primary" block @click="submit">
          {{ $t('global.submit') }}
        </KButton>
      </var-form>
    </KCard>
  </AppPage>
</template>
