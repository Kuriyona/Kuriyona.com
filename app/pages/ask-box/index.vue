<script lang="ts" setup>
const { t } = useI18n();
const { data: questions } = useAsyncData(
  'questions',
  async () => {
    const res = await fetchApi.get('/ask-box').json<
      {
        name?: string;
        ip?: string;
        question: string;
        answer: string;
        askedAt: number;
        answeredAt?: number;
      }[]
    >();
    return res.sort(
      (a, b) => Math.max(a.answeredAt || 0, a.askedAt) - Math.max(b.answeredAt || 0, b.askedAt),
    );
  },
  { server: false },
);
useSeoMeta({ title: t('ask-box.title') });
</script>

<template>
  <AppPage>
    <h2 class="text-2xl font-bold">未晞酱的提问箱</h2>
    <h3 class="text-xl font-bold">你可以...</h3>
    <KCardLink to="/ask-box/ask" text="向未晞酱提问" />
    <h3 class="text-xl font-bold">或者浏览公开的问题...</h3>
    <KCard
      v-if="questions && questions.length > 0"
      v-for="(question, index) in questions"
      :key="index">
      <div class="flex flex-col gap-2">
        <p class="text-sm">
          来自<span class="font-bold">&nbsp;{{ question.name || '匿名' }}&nbsp;</span
          ><span v-if="question.askedAt">在 {{ formatTime(question.askedAt) }} </span> 的提问
        </p>
        <p class="text-base">
          <KMarkdown :content="question.question" />
        </p>
        <hr />
        <p class="text-sm">
          由<span class="font-bold">&nbsp;未晞酱&nbsp;</span
          ><span v-if="question.answeredAt">于 {{ formatTime(question.answeredAt) }} 写下的</span
          >回答
        </p>
        <p class="text-base">
          <KMarkdown :content="question.answer" />
        </p>
      </div> </KCard
  ></AppPage>
</template>
