<script lang="ts" setup>
const mainStore = useMainStore();
const showTurnstile = ref(false);

const form = ref({
  name: '',
  showName: true,
  question: '',
  showIP: false,
  note: '',
});

const { data: questions } = useAsyncData('questions', async () => {
  const res = await fetchApi.get('/ask-box').json<
    {
      name?: string;
      ip?: string;
      question: string;
      answer: string;
    }[]
  >();
  return res;
});
const submit = async () => {
  const res = await fetchApi.post('/ask-box', {
    headers: { 'Content-Type': 'application/json', Authorization: mainStore.jwt },
    body: JSON.stringify(form.value),
  });
  if (res.status === 200) {
    Snackbar.success('提交成功');
  } else {
    Snackbar.error('提交失败');
  }
};

useSeoMeta({ title: '提问箱' });
</script>

<template>
  <AppPage>
    <h2 class="text-xl font-bold">向未晞酱提问</h2>
    <p>请在下方填写并提交你的问题，留下身份或者匿名都行喵。</p>
    <p>第一版就先这样吧，后面再调整 UI。</p>
    <var-form class="my-4 flex flex-col gap-2">
      <var-input placeholder="昵称(可选)" v-model="form.name" variant="outlined" />
      <var-input placeholder="问题" textarea v-model="form.question" variant="outlined" />
      <var-input placeholder="备注(可选/不公开)" v-model="form.note" variant="outlined" />
      <p class="flex items-center justify-between">
        <span>公开展示昵称：</span> <var-switch v-model="form.showName" />
      </p>
      <p class="flex items-center justify-between">
        <span>公开展示 IP 属地：</span> <var-switch v-model="form.showIP" />
      </p>
    </var-form>
    <KTurnstile v-model:show="showTurnstile" />
    <KCard v-if="!mainStore.jwt">
      <var-alert class="mb-2"> {{ $t('turnstile.please-verify') }} </var-alert>
      <var-button @click="showTurnstile = true" block> {{ $t('global.start') }} </var-button>
    </KCard>
    <var-button type="primary" block @click="submit"> {{ $t('global.submit') }} </var-button>

    <template v-if="questions?.length">
      <var-divider class="my-8!" />
      <h3 class="text-xl font-bold">已经被回答并公开的问题</h3>
      <p>后续会转移到单独的问题页面，不会显示在提问页面中。</p>
      <KCard v-if="questions.length > 0" v-for="(question, index) in questions" :key="index">
        <div class="flex flex-col gap-2">
          <p class="text-sm" v-if="question.name">
            来自 <span class="font-bold">{{ question.name }}</span> 的提问
          </p>
          <p class="text-base">{{ question.question }}</p>
          <hr />
          <p class="text-base">{{ question.answer }}</p>
        </div>
      </KCard>
    </template>
  </AppPage>
</template>
