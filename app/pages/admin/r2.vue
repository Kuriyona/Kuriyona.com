<script setup lang="ts">
import dayjs from 'dayjs';
import ky from 'ky';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

interface R2File {
  key: string; // 完整对象键，含 static/ 前缀
  name: string; // 末段文件名
  size: number;
  lastModified: string;
  eTag: string;
}

interface R2List {
  prefix: string; // 相对 static/ 的当前前缀（后端原样回显）
  folders: string[]; // CommonPrefixes，相对 static/，以 / 结尾
  files: R2File[];
  truncated: boolean;
}

// R2 通过自定义域名公开读取，对象键含 static/ 前缀（见 backend/src/router/r2.ts）
const R2_PUBLIC_BASE = 'https://r2.kuriyona.com/';
const publicUrl = (key: string) => `${R2_PUBLIC_BASE}${key}`;

const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const file = ref<File | null>(null);
const objectKey = ref('');
const dragging = ref(false);
const uploading = ref(false);
const resultUrl = ref('');

// 当前浏览前缀（相对 static/）：'' = 根、'2026/10/' = 目录、'image/si' = 部分前缀查询
const prefix = ref('');
const prefixDraft = ref('');

const {
  data: listing,
  refresh: refreshObjects,
  status: listStatus,
  error: listError,
} = useAsyncData(
  'admin-r2-list',
  () =>
    fetchApi
      .get('/r2/list', { searchParams: { prefix: prefix.value, delimiter: '/' } })
      .json<R2List>(),
  { server: false, lazy: true, watch: [prefix] },
);

const folders = computed(() => listing.value?.folders ?? []);
const files = computed(() => listing.value?.files ?? []);
const truncated = computed(() => listing.value?.truncated ?? false);
const segments = computed(() => prefix.value.split('/').filter(Boolean));
const folderName = (folder: string) => folder.replace(/\/$/, '').split('/').pop() ?? folder;

// 前缀的唯一入口：过滤掉用户可能粘贴进来的 'static/' 与前导斜杠，交给 watch 重新拉取
const openPrefix = (value: string) => {
  const next = value
    .trim()
    .replace(/^\/+/, '')
    .replace(/^static\//, '');
  prefix.value = next;
  prefixDraft.value = next;
};

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KiB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(2)} MiB`;
  return `${(size / 1024 ** 3).toFixed(2)} GiB`;
};

const pick = (f: File) => {
  file.value = f;
  const name = f.name || `paste-${Date.now()}.${f.type.split('/')[1] || 'png'}`;
  objectKey.value = `${dayjs().format('YYYY/MM/DD/')}${name}`;
  resultUrl.value = '';
};

const onSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const f = input.files?.[0];
  if (f) pick(f);
  input.value = '';
};

const onDrop = (event: DragEvent) => {
  dragging.value = false;
  const f = event.dataTransfer?.files?.[0];
  if (f) pick(f);
};

// 全局粘贴；焦点在输入框内时不劫持，否则粘贴对象键会清掉已选文件
const onPaste = (event: ClipboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
  for (const item of event.clipboardData?.items ?? []) {
    if (item.kind !== 'file') continue;
    const f = item.getAsFile();
    if (f) {
      pick(f);
      return;
    }
  }
};

onMounted(() => document.addEventListener('paste', onPaste));
onUnmounted(() => document.removeEventListener('paste', onPaste));

const upload = async () => {
  const f = file.value;
  const target = objectKey.value.trim();
  if (!f || !target || uploading.value) return;
  uploading.value = true;
  resultUrl.value = '';
  try {
    const { url } = await fetchApi
      .get('/r2/upload-signed-url', { searchParams: { key: target, mime: f.type } })
      .json<{ url: string }>();
    await ky.put(url, { body: f });
    resultUrl.value = publicUrl(`static/${target}`);
    toast.success('上传成功');
    // 跳到该文件所在目录，确保它出现在列表里（目录变化时 watch 自动重取）
    const dir = target.slice(0, target.lastIndexOf('/') + 1);
    if (dir === prefix.value) await refreshObjects();
    else openPrefix(dir);
  } catch (e) {
    toast.error(`上传失败：${adminErrorText(e)}`);
  } finally {
    uploading.value = false;
  }
};

const copy = async (text: string) => {
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
    <KCard title="上传文件">
      <div class="flex flex-col gap-4">
        <div
          class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm transition-colors duration-300"
          :class="
            dragging
              ? 'border-(--color-theme) text-(--color-text-1)'
              : 'border-(--color-line-strong) text-(--color-text-3)'
          "
          @click="fileInput?.click()"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop">
          <span class="material-symbols-outlined text-3xl! leading-none">upload_file</span>
          <p>点击选择文件，也可以拖拽到这里或直接粘贴（Ctrl+V）</p>
          <input ref="fileInput" type="file" class="hidden" @change="onSelect" />
        </div>

        <template v-if="file">
          <p class="text-sm">
            {{ file.name || '（粘贴的文件）' }}
            <span class="text-(--color-text-3)">
              {{ formatBytes(file.size) }} · {{ file.type || '未知类型' }}
            </span>
          </p>
          <KInput v-model="objectKey" placeholder="对象键（默认 YYYY/MM/DD/文件名）" />
          <p class="text-xs break-all text-(--color-text-3)">
            公开地址：{{ objectKey.trim() ? publicUrl(`static/${objectKey.trim()}`) : '—' }}
          </p>
          <KButton
            block
            class="flex! items-center justify-center gap-2 py-2! disabled:opacity-50"
            :disabled="uploading || !objectKey.trim()"
            @click="upload">
            {{ uploading ? '上传中…' : '上传' }}
          </KButton>
        </template>
        <p v-else class="text-xs text-(--color-text-3)">尚未选择文件。</p>
      </div>
    </KCard>

    <KCard v-if="resultUrl" title="上传结果">
      <div class="flex items-center gap-2">
        <p class="min-w-0 flex-1 text-xs break-all">{{ resultUrl }}</p>
        <KIconButton icon="content_copy" label="复制链接" @click="copy(resultUrl)" />
      </div>
    </KCard>

    <KCard title="文件浏览">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-2 sm:flex-row">
          <KInput
            v-model="prefixDraft"
            placeholder="前缀查询，例如 2026/10/ 或 image/si"
            class="flex-1"
            @keydown.enter="openPrefix(prefixDraft)" />
          <KButton class="px-3! py-1!" @click="openPrefix(prefixDraft)"> 查询 </KButton>
          <KIconButton
            icon="refresh"
            label="刷新列表"
            class="disabled:opacity-50"
            :disabled="listStatus === 'pending'"
            @click="refreshObjects()" />
        </div>

        <nav class="flex flex-wrap items-center gap-1 text-xs text-(--color-text-3)">
          <button type="button" class="k-interactive rounded-md px-2 py-1" @click="openPrefix('')">
            static/
          </button>
          <template v-for="(segment, index) in segments" :key="index">
            <span>/</span>
            <button
              type="button"
              class="k-interactive rounded-md px-2 py-1"
              @click="openPrefix(`${segments.slice(0, index + 1).join('/')}/`)">
              {{ segment }}
            </button>
          </template>
        </nav>

        <p class="text-xs text-(--color-text-3)">
          当前前缀：static/{{ listing?.prefix ?? prefix }} · {{ folders.length }} 个目录 ·
          {{ files.length }} 个文件
        </p>
        <p v-if="truncated" class="text-xs text-red-400">
          R2 单次最多返回 1000 个键，结果已截断，请用前缀缩小范围。
        </p>
        <p v-if="listStatus === 'pending'" class="text-sm text-(--color-text-3)">加载中…</p>
        <p v-if="listError" class="text-sm text-red-400">列表加载失败，请点刷新重试</p>

        <div
          v-for="folder in folders"
          :key="folder"
          class="flex items-center gap-3 border-t border-(--color-line) pt-2 text-sm">
          <button
            type="button"
            class="k-interactive flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left"
            @click="openPrefix(folder)">
            <span
              class="material-symbols-outlined shrink-0 text-base! leading-none text-(--color-text-3)">
              folder
            </span>
            <span class="truncate">{{ folderName(folder) }}</span>
          </button>
          <span class="shrink-0 text-xs text-(--color-text-3)">目录</span>
        </div>

        <div
          v-for="item in files"
          :key="item.key"
          class="flex items-center gap-3 border-t border-(--color-line) pt-2 text-sm">
          <a
            :href="publicUrl(item.key)"
            target="_blank"
            rel="noopener"
            class="min-w-0 flex-1 truncate hover:underline"
            :title="item.key">
            {{ item.name }}
          </a>
          <span class="shrink-0 text-xs text-(--color-text-3)">{{ formatBytes(item.size) }}</span>
          <span class="shrink-0 text-xs text-(--color-text-3)">
            {{ formatDate(item.lastModified) }}
          </span>
          <KIconButton icon="content_copy" label="复制链接" @click="copy(publicUrl(item.key))" />
        </div>

        <p
          v-if="
            folders.length === 0 && files.length === 0 && listStatus !== 'pending' && !listError
          "
          class="py-2 text-sm text-(--color-text-3)">
          该前缀下没有内容
        </p>
      </div>
    </KCard>
  </div>
</template>
