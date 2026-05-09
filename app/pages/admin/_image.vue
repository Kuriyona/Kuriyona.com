<!-- <script setup lang="ts">
import dayjs from 'dayjs';
import ky from 'ky';
import { ref } from 'vue';
const uploading = ref(false);
const selectedFile = ref<File | null>(null);
const fileURL = ref('');
const previewUrl = ref('');
const key = ref('');

const setDefaultKey = (ext: string) => {
  key.value =
    dayjs().format('YYYY/MM/DD/HHmmss') + Math.random().toString(36).substring(2) + `.${ext}`;
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
    setDefaultKey(file.name.split('.').pop()!);
  }
};

const handleConfirmUpload = async () => {
  if (!selectedFile.value || !apiKey.value) return;

  const file = selectedFile.value;
  const ext = file.name.split('.').pop();
  uploading.value = true;

  try {
    const res = await fetchApi.get('/r2/upload-signed-url', {
      searchParams: { key: key.value, mime: file.type, auth: apiKey.value },
    });
    if (res.status != 200) return;
    const data = await res.json<any>();
    const uploadUrl = data.url;

    await ky.put(uploadUrl, {
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    fileURL.value = `https://r2.kuriyona.com/${key.value}`;
    selectedFile.value = null;
    previewUrl.value = '';
  } catch (error) {
    console.error('Upload failed:', error);
  } finally {
    uploading.value = false;
  }
};

const handleCancel = () => {
  selectedFile.value = null;
  previewUrl.value = '';
};
</script>

<template>
  <Page>
    <var-input v-model="key" placeholder="Key" />

    <VarUploader
      type="file"
      accept="*"
      @change="handleFileSelect"
      :disabled="uploading"
      v-if="!selectedFile" />

    <div v-if="selectedFile" class="flex flex-col items-center gap-2">
      <img
        :src="previewUrl"
        alt="Preview"
        class="max-w-xs max-h-48 object-contain border rounded" />
      <p class="text-sm text-gray-600">已选择: {{ selectedFile.name }}</p>

      <div class="flex gap-2">
        <var-button
          type="primary"
          @click="handleConfirmUpload"
          :loading="uploading"
          :disabled="!apiKey">
          确认上传
        </var-button>
        <var-button type="warning" @click="handleCancel" :disabled="uploading"> 取消 </var-button>
      </div>
    </div>

    <div v-if="fileURL" class="mt-4">
      <p class="break-all">{{ fileURL }}</p>
      <img :src="fileURL" class="max-w-xs max-h-48 object-contain mt-2" />
    </div>
  </Page>
</template> -->
