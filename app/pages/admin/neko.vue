<script setup lang="ts">
const promptRaw = ref('');
const prompt = ref('');

const getPrompt = async () => {
  const res = await fetchApi.get('/neko/admin/prompt');
  promptRaw.value = await res.text();
};

const updatePrompt = async () => {
  const res = await fetchApi.post('/neko/admin/prompt', {
    body: promptRaw.value,
  });
  prompt.value = await res.text();
};

onMounted(() => {
  getPrompt();
});
</script>

<template>
  <div class="flex flex-col gap-2 m-4">
    <VarInput textarea v-model="promptRaw" />
    <VarButton @click="updatePrompt">Update</VarButton>
    <VarInput textarea v-model="prompt" disabled />
  </div>
</template>
