<script setup lang="ts">
import { HOST } from '@/scripts/api';
import { useStorage } from '@vueuse/core';
import { ref } from 'vue';

const apiKey = useStorage('API_KEY', '');
const name = ref('');
const uploading = ref(false);
const key = ref('');

const uploadImage = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0]!;
  const ext = file.name.split('.').pop();
  if (!file) return;
  uploading.value = true;
  // 替换文件名 为 name
  const fileName = name.value ? name.value + '.' + ext : file.name;
  try {
    const urlRes = await fetch(
      HOST +
        `/image/upload-signed-url?filename=${fileName}&mime=${file.type}&auth=${apiKey.value}`
    );
    const data = await urlRes.json();
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
  } catch (error) {
    console.error('Upload failed:', error);
  } finally {
    uploading.value = false;
    target.value = '';
  }
};

const imageUrl = ref('');
</script>

<template>
  <div class="flex flex-col gap-4 m-4">
    <var-input v-model="apiKey" placeholder="API Key" />
    <var-input v-model="name" placeholder="Name" />
    <VarUploader
      type="file"
      accept="image/*"
      @change="uploadImage"
      :disabled="uploading" />
    <p>{{ imageUrl }}</p>
    <img :src="imageUrl" />
  </div>
</template>
