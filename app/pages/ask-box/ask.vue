<script lang="ts" setup>
const mainStore = useMainStore();

const { t } = useI18n();

const form = ref({
  name: '',
  showName: true,
  question: '',
  showIP: false,
  note: '',
});

const submit = async () => {
  if (!form.value.question.trim()) {
    return;
  }
  const res = await fetchApi.post('/ask-box', {
    headers: { 'Content-Type': 'application/json', Authorization: mainStore.jwt },
    body: JSON.stringify(form.value),
  });
  if (res.status === 200) {
    toast.success(t('global.submit-success'));
  } else {
    toast.error(t('global.submit-fail'));
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
      <div class="flex flex-col gap-4">
        <KInput :placeholder="$t('ask-box.placeholder.nickname')" v-model="form.name" />
        <KInput
          :placeholder="$t('ask-box.placeholder.question')"
          textarea
          v-model="form.question" />
        <KInput :placeholder="$t('ask-box.placeholder.note')" v-model="form.note" />
        <p class="mt-2 flex items-center justify-between">
          <span>{{ $t('ask-box.publish-nickname') }}</span> <KSwitch v-model="form.showName" />
        </p>
        <KTurnstile />
        <KButton v-if="mainStore.jwt" type="primary" block @click="submit">
          {{ $t('global.submit') }}
        </KButton>
      </div>
    </KCard>
  </AppPage>
</template>
