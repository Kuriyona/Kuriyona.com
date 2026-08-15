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
    <KInput textarea v-model="promptRaw" />
    <button
      type="button"
      class="px-3 py-1 rounded-md bg-(--color-theme) text-black font-medium hover:opacity-80 transition-opacity duration-300 text-sm"
      @click="updatePrompt">
      Update
    </button>
    <KInput textarea v-model="prompt" disabled />
  </div>
</template>
