<script setup lang="ts">
definePageMeta({ layout: 'admin' });

const { cities, refreshFresh } = useCityMaps('admin-status');

const form = reactive({
  resident: { name: '', adcode: '' },
  current: { name: '', adcode: '' },
});
const saving = ref(false);
let initialized = false;

// 只在首次拿到配置时填表：出图期间 cities 会被轮询刷新，不能覆盖正在编辑的内容
watch(cities, (value) => {
  if (!value || initialized) return;
  initialized = true;
  for (const slot of ['resident', 'current'] as const) {
    form[slot] = { ...value[slot] };
  }
});

const save = async () => {
  saving.value = true;
  try {
    await fetchApi.post('/status', {
      json: { cities: { resident: { ...form.resident }, current: { ...form.current } } },
    });
    toast.success('已保存，地图生成中');
    await refreshFresh();
  } catch (e) {
    toast.error(adminErrorText(e));
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <KCard title="城市">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-bold text-(--color-text-2)">常住城市</h3>
          <div class="flex flex-wrap gap-2">
            <KInput v-model="form.resident.name" class="flex-1" placeholder="城市名（仅展示用）" />
            <KInput v-model="form.resident.adcode" class="flex-1" placeholder="adcode，如 330100" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-bold text-(--color-text-2)">当前所在城市</h3>
          <div class="flex flex-wrap gap-2">
            <KInput v-model="form.current.name" class="flex-1" placeholder="城市名（仅展示用）" />
            <KInput v-model="form.current.adcode" class="flex-1" placeholder="adcode，如 330100" />
          </div>
        </div>
        <div class="flex items-center gap-3">
          <KButton class="px-3! py-2! disabled:opacity-50" :disabled="saving" @click="save">
            {{ saving ? '保存中…' : '保存' }}
          </KButton>
          <span class="text-xs text-(--color-text-3)">
            保存后立即按新 adcode 出图并写入 R2；已有图的城市直接复用
          </span>
        </div>
      </div>
    </KCard>

    <div v-if="cities" class="flex flex-col gap-4 min-[600px]:flex-row">
      <CardCityMap class="flex-1" title="常住城市" :city="cities.resident" />
      <CardCityMap class="flex-1" title="当前所在城市" :city="cities.current" />
    </div>
  </div>
</template>
