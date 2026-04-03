<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { ref, onMounted, onUnmounted } from 'vue';

const apiKey = useStorage('API_KEY', '');
const name = ref('');
const uploading = ref(false);
const key = ref('');
const selectedFile = ref<File | null>(null);
const imageUrl = ref('');
const previewUrl = ref('');

const { $api } = useNuxtApp();

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && file.type.startsWith('image/')) {
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i]!.type.indexOf('image') !== -1) {
        const blob = items[i]!.getAsFile();
        if (blob) {
          selectedFile.value = new File(
            [blob],
            `pasted-image-${Date.now()}.png`,
            { type: blob.type }
          );
          previewUrl.value = URL.createObjectURL(selectedFile.value);
          break;
        }
      }
    }
  }
};

const handleConfirmUpload = async () => {
  if (!selectedFile.value || !apiKey.value) return;

  const file = selectedFile.value;
  const ext = file.name.split('.').pop();
  uploading.value = true;

  try {
    const fileName = name.value ? name.value + '.' + ext : file.name;
    const res = await $api.image['upload-signed-url'].get({
      query: { filename: fileName, mime: file.type, auth: apiKey.value }
    });
    if (res.status != 200) return;
    const data = res.data!;
    const uploadUrl = data.url;
    key.value = data.key;

    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    imageUrl.value = `https://r2.kuriyona.com/${key.value}`;
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

onMounted(() => {
  window.addEventListener('paste', handlePaste);
});

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste);
  // 清理预览URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="flex flex-col gap-4 m-4">
    <var-input v-model="apiKey" placeholder="API Key" />
    <var-input v-model="name" placeholder="Name" />

    <!-- 文件选择器 -->
    <VarUploader
      type="file"
      accept="image/*"
      @change="handleFileSelect"
      :disabled="uploading"
      v-if="!selectedFile" />

    <!-- 显示已选择的图片 -->
    <div v-if="selectedFile" class="flex flex-col items-center gap-2">
      <img
        :src="previewUrl"
        alt="Preview"
        class="max-w-xs max-h-48 object-contain border rounded" />
      <p class="text-sm text-gray-600">已选择: {{ selectedFile.name }}</p>

      <!-- 确认上传按钮 -->
      <div class="flex gap-2">
        <var-button
          type="primary"
          @click="handleConfirmUpload"
          :loading="uploading"
          :disabled="!apiKey">
          确认上传
        </var-button>
        <var-button type="warning" @click="handleCancel" :disabled="uploading">
          取消
        </var-button>
      </div>
    </div>

    <!-- 显示上传结果 -->
    <div v-if="imageUrl" class="mt-4">
      <p class="break-all">{{ imageUrl }}</p>
      <img :src="imageUrl" class="max-w-xs max-h-48 object-contain mt-2" />
    </div>
  </div>
</template>
