<script setup lang="ts">
import type { VarFile } from '@varlet/ui';
import dayjs from 'dayjs';
import ky from 'ky';

const fileList = ref<VarFile[]>([]);
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

const handleUpload = async () => {
  if (fileList.value.length == 0) return;
  const file = fileList.value[0]!;
  const signedUrl = await getSignedUrl(key.value, file.file!.type);
  if (!signedUrl) return;
  const res = await ky.put(signedUrl, { body: file.file! });
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
      const varFile: VarFile = {
        file: file,
        name: file.name || `paste-${Date.now()}.${file.type.split('/')[1] || 'png'}`,
      };
      fileList.value = [varFile];
      const name = varFile.name;
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
    <VarUploader v-model="fileList" accept="*" maxlength="1" @after-read="handleRead" />
    <VarInput v-model="key" />
    <VarButton type="primary" @click="handleUpload" :disabled="fileList.length == 0">
      上传
    </VarButton>
    <var-divider />
    <p>文件URL为：{{ lastFileURL }}</p>
  </AppPage>
</template>
