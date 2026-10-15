<script setup lang="ts">
import { useStorage } from '@vueuse/core';

definePageMeta({ layout: 'admin' });

const key = useStorage('API_KEY', '');
const showKey = ref(false);
const checking = ref(false);
const valid = ref<boolean | null>(null);

const save = async () => {
  key.value = key.value.trim();
  if (!key.value || checking.value) return;
  checking.value = true;
  try {
    await fetchApi.get('/ask-box/admin');
    valid.value = true;
    toast.success('密钥有效，已保存到本机');
  } catch (e) {
    valid.value = false;
    toast.error(adminErrorText(e));
  } finally {
    checking.value = false;
  }
};

// 改密钥后需要重新校验，避免沿用上一次的结论
watch(key, () => (valid.value = null));
</script>

<template>
  <div class="flex flex-col gap-4">
    <KCard title="管理密钥">
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <KInput
            v-model="key"
            :type="showKey ? 'text' : 'password'"
            placeholder="与 Worker 的 AUTH_KEY 一致"
            @keydown.enter="save" />
          <KIconButton
            :icon="showKey ? 'material-symbols:visibility-off' : 'material-symbols:visibility'"
            :label="showKey ? '隐藏密钥' : '显示密钥'"
            @click="showKey = !showKey" />
        </div>
        <div class="flex items-center gap-3">
          <KButton
            class="px-3! py-2! disabled:opacity-50"
            :disabled="checking || !key.trim()"
            @click="save">
            {{ checking ? '校验中…' : '保存并校验' }}
          </KButton>
          <KBadge v-if="valid === true">校验通过</KBadge>
          <span v-else-if="valid === false" class="text-sm text-red-400">密钥无效</span>
          <span v-else class="text-sm text-(--color-text-3)">未校验</span>
        </div>
        <p class="text-xs text-(--color-text-3)">
          密钥仅保存在本机 localStorage，所有管理请求以
          <code>X-Auth-Key</code> 请求头携带；校验方式为请求 GET /api/ask-box/admin。
        </p>
      </div>
    </KCard>

    <KCard title="管理入口">
      <div class="flex flex-col gap-3">
        <KCardLink to="/admin/r2" text="文件上传" desc="拖拽 / 粘贴上传到 R2，复制公开链接" />
        <KCardLink to="/admin/ask-box" text="提问箱审核" desc="回答、公开或删除提问" />
        <KCardLink
          to="/admin/city"
          text="城市地图"
          desc="在浏览器里出图，直传 R2 并更新首页城市卡片" />
        <KCardLink
          to="/admin/cache"
          text="缓存清除"
          desc="按 URL / 主机名 / 标签 / 前缀清 Cloudflare 边缘缓存" />
        <KCardLink
          to="/admin/music"
          text="音乐缓存"
          desc="立即刷新歌单 / 全部歌词的 Worker 侧 KV 缓存" />
      </div>
    </KCard>
  </div>
</template>
