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

// 图片压缩（compressorjs 只在压缩时动态载入，不进 admin 首屏 chunk）
// 可压缩的位图类型：排除 svg（矢量，光栅化没有意义）与 gif（会丢动画）
const COMPRESSIBLE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/bmp']);
const COMPRESS_FORMATS: { value: string; label: string }[] = [
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
];
const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
};

const compressQuality = ref(0.8);
const compressFormat = ref<string>('image/webp');
const compressing = ref(false);
const compressError = ref('');
const compressed = ref<{ file: File; url: string } | null>(null);
const useCompressed = ref(false);
const originalUrl = ref('');

const compressible = computed(() => !!file.value && COMPRESSIBLE_TYPES.has(file.value.type));
const uploadFile = computed(() =>
  useCompressed.value && compressed.value ? compressed.value.file : file.value,
);
const previewUrl = computed(() =>
  useCompressed.value && compressed.value ? compressed.value.url : originalUrl.value,
);
const savedPercent = computed(() => {
  const src = file.value;
  const out = compressed.value?.file;
  if (!src?.size || !out) return 0;
  return Math.round((1 - out.size / src.size) * 100);
});

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

const revokeOriginalUrl = () => {
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
  originalUrl.value = '';
};

const resetCompression = () => {
  if (compressed.value) URL.revokeObjectURL(compressed.value.url);
  compressed.value = null;
  useCompressed.value = false;
  compressError.value = '';
};

const pick = (f: File) => {
  resetCompression();
  revokeOriginalUrl();
  file.value = f;
  if (COMPRESSIBLE_TYPES.has(f.type)) originalUrl.value = URL.createObjectURL(f);
  const name = f.name || `paste-${Date.now()}.${f.type.split('/')[1] || 'png'}`;
  objectKey.value = `${dayjs().format('YYYY/MM/DD/')}${name}`;
  resultUrl.value = '';
};

// 只替换末段扩展名，保留用户手改过的目录与文件名
const replaceExt = (key: string, ext: string) => {
  if (!key) return key;
  const slash = key.lastIndexOf('/');
  const dot = key.lastIndexOf('.');
  return `${dot > slash ? key.slice(0, dot) : key}.${ext}`;
};

// 切换上传版本时同步对象键扩展名，避免界面显示 .png 实际存成 .webp
const selectSource = (useCompressedSource: boolean) => {
  if (useCompressedSource && !compressed.value) return;
  useCompressed.value = useCompressedSource;
  const target = useCompressedSource ? compressed.value?.file : file.value;
  const ext = target ? EXT_BY_TYPE[target.type] : undefined;
  if (ext) objectKey.value = replaceExt(objectKey.value.trim(), ext);
};

const compress = async () => {
  const f = file.value;
  if (!f || !compressible.value || compressing.value) return;
  compressing.value = true;
  compressError.value = '';
  try {
    const { default: Compressor } = await import('compressorjs');
    const mimeType = compressFormat.value;
    const blob = await new Promise<Blob>((resolve, reject) => {
      new Compressor(f, {
        quality: compressQuality.value,
        mimeType,
        // 默认 convertTypes 会在 PNG > 5MB 时强制转 JPEG，这里关掉以免输出格式与设置不符
        convertTypes: [],
        success: resolve,
        error: reject,
      });
    });
    if (!blob.size) throw new Error('压缩结果为空');
    // 浏览器可能不支持所选编码而回退（如 canvas 无 webp），以实际 Blob 类型为准
    const outType = blob.type || mimeType;
    const ext = EXT_BY_TYPE[outType] ?? outType.split('/')[1] ?? 'img';
    const name =
      replaceExt(f.name || `image.${ext}`, ext)
        .split('/')
        .pop() ?? `image.${ext}`;
    const out = new File([blob], name, { type: outType, lastModified: Date.now() });
    if (compressed.value) URL.revokeObjectURL(compressed.value.url);
    compressed.value = { file: out, url: URL.createObjectURL(out) };
    selectSource(true);
  } catch (e) {
    compressed.value = null;
    useCompressed.value = false;
    compressError.value = e instanceof Error ? e.message : String(e);
  } finally {
    compressing.value = false;
  }
};

// 参数改了，旧结果与显示的参数不符，直接作废并回到原图
watch([compressQuality, compressFormat], () => {
  if (!compressed.value) return;
  resetCompression();
  const ext = file.value ? EXT_BY_TYPE[file.value.type] : undefined;
  if (ext) objectKey.value = replaceExt(objectKey.value.trim(), ext);
});

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
onUnmounted(() => {
  document.removeEventListener('paste', onPaste);
  resetCompression();
  revokeOriginalUrl();
});

const upload = async () => {
  const f = uploadFile.value;
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
          <KIcon name="material-symbols:upload-file" class="text-3xl" />
          <p>点击选择文件，也可以拖拽到这里或直接粘贴（Ctrl+V）</p>
          <input ref="fileInput" type="file" class="hidden" @change="onSelect" />
        </div>

        <template v-if="file">
          <p class="text-sm">
            {{ uploadFile?.name || '（粘贴的文件）' }}
            <span class="text-(--color-text-3)">
              {{ formatBytes(uploadFile?.size ?? 0) }} · {{ uploadFile?.type || '未知类型' }}
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

    <KCard v-if="compressible" title="压缩图片">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 text-xs text-(--color-text-2)">质量</span>
          <input
            v-model.number="compressQuality"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            class="w-full accent-(--color-theme)" />
          <span class="w-10 shrink-0 text-right text-xs text-(--color-text-2)">
            {{ Math.round(compressQuality * 100) }}%
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 text-xs text-(--color-text-2)">输出格式</span>
          <KSelect v-model="compressFormat" :options="COMPRESS_FORMATS" class="flex-1" />
        </div>

        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="图片预览"
          class="max-h-56 w-full rounded-md bg-(--color-surface-inset) object-contain" />

        <KButton
          block
          class="flex! items-center justify-center gap-2 py-2! disabled:opacity-50"
          :disabled="compressing"
          @click="compress">
          <KIcon
            :name="compressing ? 'material-symbols:hourglass' : 'material-symbols:image-arrow-up'"
            class="text-base" />
          {{ compressing ? '压缩中…' : compressed ? '重新压缩' : '压缩图片' }}
        </KButton>

        <p v-if="compressError" class="text-xs text-red-400">压缩失败：{{ compressError }}</p>

        <template v-if="compressed">
          <KDivider label="上传版本" />
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="k-interactive rounded-md border p-2 text-left text-xs transition-colors duration-300"
              :class="
                !useCompressed
                  ? 'border-(--color-theme) text-(--color-text-1)'
                  : 'border-(--color-line-strong) text-(--color-text-2)'
              "
              @click="selectSource(false)">
              <span class="block">原图</span>
              <span class="block text-(--color-text-3)">{{ formatBytes(file?.size ?? 0) }}</span>
            </button>
            <button
              type="button"
              class="k-interactive rounded-md border p-2 text-left text-xs transition-colors duration-300"
              :class="
                useCompressed
                  ? 'border-(--color-theme) text-(--color-text-1)'
                  : 'border-(--color-line-strong) text-(--color-text-2)'
              "
              @click="selectSource(true)">
              <span class="block">压缩后</span>
              <span class="block text-(--color-text-3)">
                {{ formatBytes(compressed.file.size) }}
              </span>
            </button>
          </div>
          <p class="text-xs text-(--color-text-3)">
            当前将上传{{ useCompressed ? '压缩后的图片' : '原图' }} ·
            {{ savedPercent >= 0 ? `减小 ${savedPercent}%` : `增大 ${-savedPercent}%` }}
          </p>
        </template>
      </div>
    </KCard>

    <KCard v-if="resultUrl" title="上传结果">
      <div class="flex items-center gap-2">
        <p class="min-w-0 flex-1 text-xs break-all">{{ resultUrl }}</p>
        <KIconButton
          icon="material-symbols:content-copy"
          label="复制链接"
          @click="copy(resultUrl)" />
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
            icon="material-symbols:refresh"
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
            <KIcon
              name="material-symbols:folder"
              class="shrink-0 text-base text-(--color-text-3)" />
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
          <KIconButton
            icon="material-symbols:content-copy"
            label="复制链接"
            @click="copy(publicUrl(item.key))" />
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
