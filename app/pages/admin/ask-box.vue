<script setup lang="ts">
const onlyUnanswered = ref(false);
const answer = ref('');
const { data: questions, refresh } = useAsyncData(
  async () =>
    await fetchApi('/ask-box/admin').json<
      {
        id: number;
        name?: string;
        showName: number;
        ip?: string;
        ua?: string;
        showIP: number;
        question: string;
        answer?: string;
        note?: string;
        public: number;
        askedAt: number;
        answeredAt?: number;
      }[]
    >(),
  { server: false },
);
const setPublic = async (id: number, isPublic: number) => {
  await fetchApi.put(`/ask-box/admin/${id}/public/${isPublic}`);
  refresh();
};
const deleteQuestion = async (id: number) => {
  await fetchApi.delete(`/ask-box/admin/${id}`);
  refresh();
};
const answerQuestion = async (id: number) => {
  await fetchApi.put(`/ask-box/admin/${id}/answer/${encodeURIComponent(answer.value)}`);
  refresh();
};
</script>

<template>
  <AppPage>
    <p class="flex items-center justify-between">
      <span>只显示未回答问题</span>
      <var-switch v-model="onlyUnanswered" />
    </p>
    <var-button @click="refresh()">刷新</var-button>
    <var-input textarea v-model="answer" />
    <div
      v-for="question in questions?.filter((q) => (onlyUnanswered ? !q.answer : true))"
      :key="question.id">
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          <span>{{ question.name }}</span>
          <span>{{ question.ip }}</span>
          <span>{{ question.public }}</span>
          <span>{{ formatTime(question.askedAt) }}</span>
        </div>
        <pre class="whitespace-pre-wrap">{{ question.ua || '无 User-Agent' }}</pre>
        <pre class="whitespace-pre-wrap">{{ question.question || '无问题' }}</pre>
        <pre class="whitespace-pre-wrap">{{ question.note || '无备注' }}</pre>
        <pre class="whitespace-pre-wrap">{{ question.answer || '无回答' }}</pre>
      </div>
      <var-button @click="setPublic(question.id, 1)">公开</var-button>
      <var-button @click="setPublic(question.id, 0)">不公开</var-button>
      <var-button @click="deleteQuestion(question.id)">删除</var-button>
      <var-button @click="answerQuestion(question.id)">回答</var-button>
    </div>
  </AppPage>
</template>
