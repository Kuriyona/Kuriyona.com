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
      <KIconButton icon="material-symbols:refresh" @click="refresh" />
    </h3>
    <KInput :placeholder="$t('global.search')" v-model="search.text" />
    <KCard v-for="(question, index) in questions" :key="index" class="flex flex-col gap-4">
      <!-- 元信息与被它标注的内容成组：组内 gap-1，组间 gap-4 -->
      <div class="flex flex-col gap-1">
        <p class="text-sm text-(--color-text-3)">
          <span class="font-bold text-(--color-text-1)">
            @{{ question.name || $t('global.anonymous') }}
          </span>
          {{ $t('ask-box.asked-at', [formatTime(question.askedAt)]) }}
        </p>
        <!-- KMarkdown 根节点是 div，不能套在 <p> 里：块级元素会提前关闭 p，text-base 只会落到一个空 p 上 -->
        <KMarkdown :content="question.question" />
      </div>
      <KDivider />
      <div class="flex flex-col gap-1">
        <p class="text-sm text-(--color-text-3)">
          <span class="font-bold text-(--color-text-1)">@{{ $t('global.weixi') }}</span>
          {{ $t('ask-box.answered-at', [formatTime(question.answeredAt)]) }}
        </p>
        <KMarkdown :content="question.answer" />
      </div>
    </KCard>
  </AppPage>
</template>
