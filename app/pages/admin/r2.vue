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
</script>

<template>
  <Page>
    <VarUploader v-model="fileList" accept="*" maxlength="1" @after-read="handleRead" />
    <VarInput v-model="key" />
    <VarButton type="primary" @click="handleUpload" :disabled="fileList.length == 0">
      上传
    </VarButton>
    <hr />
    <p>文件URL为：{{ lastFileURL }}</p>
  </Page>
</template>
