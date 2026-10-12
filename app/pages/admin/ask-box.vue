<script setup lang="ts">
definePageMeta({ layout: 'admin' });

const { t } = useI18n();

interface AskQuestion {
  id: string;
  name?: string | null;
  showName: number;
  ip?: string | null;
  ua?: string | null;
  showIP: number;
  question?: string | null;
  answer?: string | null;
  note?: string | null;
  public: number;
  askedAt: number;
  answeredAt?: number | null;
}

const {
  data: questions,
  refresh,
  status,
  error,
} = useAsyncData('admin-asks', () => fetchApi.get('/ask-box/admin').json<AskQuestion[]>(), {
  server: false,
  lazy: true,
});

const search = ref('');
const answerFilter = ref('all');
const publicFilter = ref('all');

const answerOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'unanswered', label: '未回答' },
  { value: 'answered', label: '已回答' },
];
const publicOptions = [
  { value: 'all', label: '全部公开状态' },
  { value: 'public', label: '已公开' },
  { value: 'private', label: '未公开' },
];

const shown = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return (questions.value ?? [])
    .filter((q) => {
      if (answerFilter.value === 'unanswered' && q.answer) return false;
      if (answerFilter.value === 'answered' && !q.answer) return false;
      if (publicFilter.value === 'public' && q.public !== 1) return false;
      if (publicFilter.value === 'private' && q.public === 1) return false;
      if (!keyword) return true;
      return [q.name, q.question, q.note, q.answer, q.ip].some((v) =>
        (v ?? '').toLowerCase().includes(keyword),
      );
    })
    .sort((a, b) => b.askedAt - a.askedAt);
});

const stats = computed(() => {
  const list = questions.value ?? [];
  return {
    total: list.length,
    unanswered: list.filter((q) => !q.answer).length,
    public: list.filter((q) => q.public === 1).length,
  };
});

const busyId = ref('');

const togglePublic = async (q: AskQuestion) => {
  busyId.value = q.id;
  try {
    await fetchApi.put(`/ask-box/admin/${q.id}/public/${q.public === 1 ? 0 : 1}`);
    toast.success(q.public === 1 ? '已设为不公开' : '已公开');
    await refresh();
  } catch (e) {
    toast.error(adminErrorText(e));
  } finally {
    busyId.value = '';
  }
};

// 回答弹窗
const editing = ref<AskQuestion | null>(null);
const draft = ref('');
const preview = ref(false);
const saving = ref(false);

const editOpen = computed({
  get: () => !!editing.value,
  set: (value) => {
    if (!value) editing.value = null;
  },
});

const openAnswer = (q: AskQuestion) => {
  editing.value = q;
  draft.value = q.answer ?? '';
  preview.value = false;
};

const saveAnswer = async () => {
  const q = editing.value;
  if (!q || !draft.value.trim() || saving.value) return;
  saving.value = true;
  try {
    await fetchApi.put(`/ask-box/admin/${q.id}/answer`, { json: { answer: draft.value } });
    toast.success('回答已保存');
    editing.value = null;
    await refresh();
  } catch (e) {
    toast.error(adminErrorText(e));
  } finally {
    saving.value = false;
  }
};

// 删除确认
const deleting = ref<AskQuestion | null>(null);
const removing = ref(false);

const deleteOpen = computed({
  get: () => !!deleting.value,
  set: (value) => {
    if (!value) deleting.value = null;
  },
});

const remove = async () => {
  const q = deleting.value;
  if (!q || removing.value) return;
  removing.value = true;
  try {
    await fetchApi.delete(`/ask-box/admin/${q.id}`);
    toast.success('提问已删除');
    deleting.value = null;
    await refresh();
  } catch (e) {
    toast.error(adminErrorText(e));
  } finally {
    removing.value = false;
  }
};

const copy = async (q: AskQuestion) => {
  const text = `@${q.name || t('global.anonymous')} 问：${q.question ?? ''}\n\n答：${q.answer ?? ''}`;
  try {
    await navigator.clipboard.writeText(text);
    toast.success(t('global.copy-success'));
  } catch {
    toast.error('复制失败');
  }
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-(--color-text-3)">
        共 {{ stats.total }} 条 · 未回答 {{ stats.unanswered }} 条 · 公开 {{ stats.public }} 条
      </p>
      <KIconButton
        icon="refresh"
        label="刷新"
        class="disabled:opacity-50"
        :disabled="status === 'pending'"
        @click="refresh()" />
    </div>

    <div class="flex flex-col gap-2 sm:flex-row">
      <KInput v-model="search" placeholder="搜索问题 / 昵称 / 备注 / 回答 / IP" class="flex-1" />
      <KSelect v-model="answerFilter" :options="answerOptions" class="sm:w-36" />
      <KSelect v-model="publicFilter" :options="publicOptions" class="sm:w-40" />
    </div>

    <p v-if="status === 'pending'" class="text-sm text-(--color-text-3)">加载中…</p>
    <p v-else-if="error" class="text-sm text-red-400">列表加载失败，请点刷新重试</p>
    <p v-else-if="shown.length === 0" class="text-sm text-(--color-text-3)">没有符合条件的提问</p>

    <KCard v-for="q in shown" :key="q.id">
      <article class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <KBadge v-if="q.answer">已回答</KBadge>
          <span
            v-else
            class="rounded-full border border-(--color-control-border) px-2 py-0.5 text-(--color-text-3)">
            未回答
          </span>
          <KBadge v-if="q.public === 1">公开</KBadge>
          <span
            v-else
            class="rounded-full border border-(--color-control-border) px-2 py-0.5 text-(--color-text-3)">
            未公开
          </span>
          <span class="font-bold">@{{ q.name || '匿名' }}</span>
          <span v-if="q.showName !== 1" class="text-(--color-text-3)"
            >（提问者选择不展示昵称）</span
          >
          <span class="ml-auto text-(--color-text-3)">{{ formatTime(q.askedAt) }}</span>
        </div>

        <p class="break-all text-xs text-(--color-text-3)">
          {{ q.ip || '无 IP' }} · {{ q.ua || '无 User-Agent' }}
        </p>

        <p class="whitespace-pre-wrap">{{ q.question || '（无问题内容）' }}</p>
        <p v-if="q.note" class="text-sm text-(--color-text-3)">备注：{{ q.note }}</p>

        <template v-if="q.answer">
          <KDivider />
          <p class="whitespace-pre-wrap text-(--color-text-2)">{{ q.answer }}</p>
          <p v-if="q.answeredAt" class="text-xs text-(--color-text-3)">
            回答于 {{ formatTime(q.answeredAt) }}
          </p>
        </template>

        <div class="flex flex-wrap gap-2">
          <KButton class="px-3! py-1!" :disabled="busyId === q.id" @click="openAnswer(q)">
            {{ q.answer ? '编辑回答' : '回答' }}
          </KButton>
          <KButton class="px-3! py-1!" :disabled="busyId === q.id" @click="togglePublic(q)">
            {{ q.public === 1 ? '取消公开' : '公开' }}
          </KButton>
          <KButton class="px-3! py-1!" @click="copy(q)">复制</KButton>
          <KButton class="px-3! py-1! text-red-400!" @click="deleting = q">删除</KButton>
        </div>
      </article>
    </KCard>

    <KDialog v-model="editOpen" title="回答提问" width="max-w-2xl">
      <div class="flex flex-col gap-3">
        <p
          class="max-h-40 overflow-y-auto rounded-md border border-(--color-line-strong) bg-(--color-surface-inset) p-3 text-sm whitespace-pre-wrap text-(--color-text-2)">
          {{ editing?.question || '（无问题内容）' }}
        </p>
        <KInput v-model="draft" textarea rows="8" placeholder="写下回答（支持 Markdown）" />
        <p class="flex items-center justify-between text-sm">
          <span>预览 Markdown</span>
          <KSwitch v-model="preview" />
        </p>
        <KMarkdown v-if="preview && draft" :content="draft" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <KButton class="px-3! py-1!" :disabled="saving" @click="editOpen = false">取消</KButton>
          <KButton
            class="px-3! py-1! disabled:opacity-50"
            :disabled="saving || !draft.trim()"
            @click="saveAnswer">
            {{ saving ? '保存中…' : '保存回答' }}
          </KButton>
        </div>
      </template>
    </KDialog>

    <KDialog v-model="deleteOpen" title="删除提问" width="max-w-md">
      <div class="flex flex-col gap-3">
        <p>确认删除这条提问？删除后无法恢复。</p>
        <p
          class="max-h-32 overflow-y-auto rounded-md border border-(--color-line-strong) bg-(--color-surface-inset) p-3 text-sm whitespace-pre-wrap text-(--color-text-3)">
          {{ deleting?.question || '（无问题内容）' }}
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <KButton class="px-3! py-1!" :disabled="removing" @click="deleteOpen = false"
            >取消</KButton
          >
          <KButton
            class="px-3! py-1! text-red-400! disabled:opacity-50"
            :disabled="removing"
            @click="remove">
            {{ removing ? '删除中…' : '删除' }}
          </KButton>
        </div>
      </template>
    </KDialog>
  </div>
</template>
