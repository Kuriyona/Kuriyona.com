<script lang="ts" setup>
const { t } = useI18n();
const { data: rawQuestions, refresh } = useAsyncData(
  'questions',
  async () => {
    const res = await fetchApi.get('/ask-box').json<
      {
        name?: string;
        ip?: string;
        question: string;
        answer: string;
        askedAt: number;
        answeredAt: number;
      }[]
    >();
    return res.sort(
      (a, b) => Math.max(b.answeredAt || 0, b.askedAt) - Math.max(a.answeredAt || 0, a.askedAt),
    );
  },
  { server: false },
);
const search = ref({
  text: '',
});
const questions = computed(() => {
  return rawQuestions.value?.filter((q) => q.question.includes(search.value.text));
});
useSeoMeta({ title: t('ask-box.title') });
</script>

<template>
  <AppPage>
    <h2 class="text-2xl font-bold">{{ $t('ask-box.weixi-askbox') }}</h2>
    <h3 class="text-xl font-bold">{{ $t('ask-box.you-can') }}</h3>
    <KCardLink to="/ask-box/ask" :text="$t('ask-box.ask-me')" />
    <h3 class="text-xl font-bold flex items-center justify-between">
      <span>{{ $t('ask-box.browse-public-questions') }}</span>
      <KButton round text @click="refresh">
        <span class="material-symbols-outlined"> refresh </span>
      </KButton>
    </h3>
    <var-input :placeholder="$t('global.search')" v-model="search.text" variant="outlined" />
    <KCard
      v-if="questions && questions.length > 0"
      v-for="(question, index) in questions"
      :key="index">
      <div class="flex flex-col gap-2">
        <p class="text-sm">
          <span class="font-bold">@{{ question.name || $t('global.anonymous') }}</span>
          {{ $t('ask-box.asked-at', [formatTime(question.askedAt)]) }}
        </p>
        <p class="text-base">
          <KMarkdown :content="question.question" />
        </p>
        <hr />
        <p class="text-sm">
          <span class="font-bold">@{{ $t('weixi-chan') }}</span>
          {{ $t('ask-box.answered-at', [formatTime(question.answeredAt)]) }}
        </p>
        <p class="text-base">
          <KMarkdown :content="question.answer" />
        </p>
      </div>
    </KCard>
  </AppPage>
</template>
