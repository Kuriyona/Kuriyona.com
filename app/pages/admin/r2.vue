<script setup lang="ts">
import dayjs from 'dayjs';
import ky from 'ky';

interface UploadFile {
  file: File;
  name: string;
}

const fileList = ref<UploadFile[]>([]);
const lastFileURL = ref('');
const key = ref('');

const getSignedUrl = async (key: string, mime: string) => {
  const res = await fetchApi.get('/r2/upload-signed-url', {
    searchParams: { key, mime },
  });
  if (res.status != 200) return;
  const data = await res.json<any>();
  return data.url;
};

const handleRead = () => {
  const file = fileList.value[0]!;
  const name = file.name;
  key.value = `${dayjs().format('YYYY/MM/DD/')}${name}`;
};

const handleSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  fileList.value = [{ file, name: file.name }];
  handleRead();
  input.value = '';
};

const handleUpload = async () => {
  if (fileList.value.length == 0) return;
  const file = fileList.value[0]!;
  const signedUrl = await getSignedUrl(key.value, file.file.type);
  if (!signedUrl) return;
  const res = await ky.put(signedUrl, { body: file.file });
  lastFileURL.value = `https://r2.kuriyona.com/static/${key.value}`;
  if (res.status != 200) return;
};

const handlePasteFile = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.indexOf('image') !== -1 || item.type.indexOf('file') !== -1) {
      const file = item.getAsFile();
      if (!file) continue;
      const uploadFile: UploadFile = {
        file: file,
        name: file.name || `paste-${Date.now()}.${file.type.split('/')[1] || 'png'}`,
      };
      fileList.value = [uploadFile];
      const name = uploadFile.name;
      key.value = `${dayjs().format('YYYY/MM/DD/')}${name}`;
    }
  }
};

onMounted(() => {
  document.addEventListener('paste', handlePasteFile);
});

onUnmounted(() => {
  document.removeEventListener('paste', handlePasteFile);
});
</script>

<template>
  <AppPage>
    <input type="file" accept="*" @change="handleSelect" />
    <KInput v-model="key" />
    <button
      type="button"
      class="px-3 py-1 rounded-md bg-(--color-theme) text-black font-medium hover:opacity-80 transition-opacity duration-300 text-sm disabled:opacity-50"
      @click="handleUpload"
      :disabled="fileList.length == 0">
      上传
    </button>
    <KDivider />
    <p>文件URL为：{{ lastFileURL }}</p>
  </AppPage>
</template>
