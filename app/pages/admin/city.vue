<script setup lang="ts">
import type { GenerateResult, SpanOptions } from '@kuriyona/amap-box';
import ky, { HTTPError } from 'ky';
import type { Cities } from '~/scripts/cityTypes';

definePageMeta({ layout: 'admin' });

// 出图参数与离线脚本逐字一致（见 backend/docs/city-map.md）：`--up 1 --down 0 --ratio 1
// --outside-same-level --no-title --no-context-labels --no-target-label --center target`
const GENERATE_OPTIONS: SpanOptions = {
  up: 1,
  down: 0,
  ratio: 1,
  outsideSameLevel: true,
  title: false,
  contextLabels: false,
  targetLabels: false,
  center: 'target',
};

const FIELDS = [
  { key: 'resident', label: '常住城市' },
  { key: 'current', label: '当前所在城市' },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

interface GeneratedMap {
  name: string;
  adcode: string;
  svg: string;
  previewUrl: string;
  notes: string[];
}

const keywords = reactive<Record<FieldKey, string>>({ resident: '', current: '' });
const maps = ref<Partial<Record<FieldKey, GeneratedMap>>>({});
const busy = ref(false);
const phase = ref('');
const fetches = ref(0);
const elapsed = ref(0);
const ignoreCache = ref(false);

// 常住与当前常常是同一个城市：按 adcode 合并成一行，避免两张一模一样的预览
const results = computed(() => {
  const grouped: { adcode: string; labels: string[]; map: GeneratedMap }[] = [];
  for (const field of FIELDS) {
    const map = maps.value[field.key];
    if (!map) continue;
    const row = grouped.find((item) => item.adcode === map.adcode);
    if (row) row.labels.push(field.label);
    else grouped.push({ adcode: map.adcode, labels: [field.label], map });
  }
  return grouped;
});

const { data: live } = useAsyncData(
  'admin-city-maps',
  async () => await fetchApi.get('/city').json<Cities>(),
  { server: false, lazy: true },
);

// 预填当前线上城市名，省得手打；用户改过之后就不再覆盖
watch(live, (cities) => {
  if (!cities || keywords.resident) return;
  keywords.resident = cities.resident.name;
  keywords.current = cities.current.name;
});

const releasePreviews = () => {
  for (const map of Object.values(maps.value)) if (map) URL.revokeObjectURL(map.previewUrl);
};

onUnmounted(releasePreviews);

const applyMaps = async () => {
  const resident = maps.value.resident;
  // 两地相同是常态：current 缺失就跟随 resident
  const current = maps.value.current ?? resident;
  if (!resident || !current) return;
  busy.value = true;
  try {
    phase.value = `上传到 R2（${results.value.length} 张）…`;
    for (const { map } of results.value) {
      const { url } = await fetchApi
        .get('/city/map/upload-url', { searchParams: { adcode: map.adcode } })
        .json<{ url: string }>();
      // 签名把 Content-Type 一起签了：PUT 必须原样带上同一个值，否则 R2 报签名不匹配
      await ky.put(url, { body: map.svg, headers: { 'content-type': 'image/svg+xml' } });
    }
    phase.value = '写入城市配置…';
    const cities = await fetchApi
      .put('/city', {
        json: {
          resident: { name: resident.name, adcode: resident.adcode },
          current: { name: current.name, adcode: current.adcode },
        },
      })
      .json<Cities>();
    await refreshNuxtData('admin-city-maps');
    toast.success('已应用到线上');
    phase.value = `完成：常住 ${cities.resident.name} / 当前 ${cities.current.name}`;
  } catch (e) {
    phase.value = '';
    toast.error(`应用失败：${adminErrorText(e)}`);
  } finally {
    busy.value = false;
  }
};

const generate = async () => {
  const wanted: Record<FieldKey, string> = {
    resident: keywords.resident.trim(),
    current: keywords.current.trim() || keywords.resident.trim(),
  };
  if (!wanted.resident || busy.value) return;

  busy.value = true;
  fetches.value = 0;
  elapsed.value = 0;
  releasePreviews();
  maps.value = {};
  const started = Date.now();
  const timer = setInterval(() => (elapsed.value = (Date.now() - started) / 1000), 200);

  try {
    phase.value = '加载出图库…';
    const { AmapBox } = await import('@kuriyona/amap-box');
    if (ignoreCache.value) await boundaryCache.clear();

    const box = new AmapBox({
      // key 由 Worker 注入（浏览器拿不到），这里只是库要求的占位符
      Key: 'worker-side',
      fetch: async (url, signal) => {
        const params: Record<string, string> = {};
        new URL(url).searchParams.forEach((value, name) => {
          if (name !== 'key') params[name] = value;
        });
        // KV 那一层缓存要显式绕过（库的 refresh 只管它自己那层）
        if (ignoreCache.value) params.nocache = '1';
        fetches.value += 1;
        phase.value = `取数中（本轮新增 ${fetches.value} 条）…`;
        try {
          return await fetchApi.get('/city/amap', { searchParams: params, signal }).json();
        } catch (e) {
          if (e instanceof HTTPError && e.response.status === 401) {
            throw new Error('管理密钥无效或已失效，请到「密钥」页重新校验');
          }
          throw e;
        }
      },
      cache: boundaryCache,
    });

    // 两地相同时只出一张图
    const generated = new Map<string, GeneratedMap>();
    for (const keyword of new Set([wanted.resident, wanted.current])) {
      phase.value = `出图：${keyword}…`;
      const output: GenerateResult[] = await box.generate(keyword, {
        ...GENERATE_OPTIONS,
        refresh: ignoreCache.value,
      });
      if (output.length !== 1) {
        throw new Error(`「${keyword}」匹配到 ${output.length} 个行政区，请改用 adcode 精确指定`);
      }
      const [result] = output;
      if (!result?.svg) {
        throw new Error(`「${keyword}」出图失败：${result?.notes.map((n) => n.text).join('；')}`);
      }
      generated.set(keyword, {
        name: result.landed.name,
        adcode: result.landed.adcode,
        svg: result.svg,
        previewUrl: URL.createObjectURL(new Blob([result.svg], { type: 'image/svg+xml' })),
        notes: result.notes.map((n) => n.text),
      });
    }

    maps.value = {
      resident: generated.get(wanted.resident),
      current: generated.get(wanted.current),
    };
    phase.value = `出图完成：新增取数 ${fetches.value} 条 · ${elapsed.value.toFixed(1)}s`;
  } catch (e) {
    phase.value = '';
    toast.error(e instanceof Error ? e.message : '出图失败');
  } finally {
    clearInterval(timer);
    busy.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <KCard title="线上配置">
      <div class="flex flex-col gap-3 text-sm">
        <div v-for="field in FIELDS" :key="field.key" class="flex flex-wrap items-center gap-2">
          <KBadge>{{ field.label }}</KBadge>
          <template v-if="live">
            <span>{{ live[field.key].name }}</span>
            <span class="text-xs text-(--color-text-3)">{{ live[field.key].adcode }}</span>
            <a class="link text-xs" :href="live[field.key].map" target="_blank" rel="noreferrer">
              查看线上图
            </a>
          </template>
          <span v-else class="text-xs text-(--color-text-3)">加载中…</span>
        </div>
      </div>
    </KCard>

    <KCard title="重新出图">
      <div class="flex flex-col gap-4">
        <p class="text-xs text-(--color-text-3)">
          填城市名或 adcode。出图在浏览器里完成（高德 key 由 Worker 注入，前端拿不到），冷缓存约 25
          秒、热缓存不到 1 秒；参数与离线脚本一致。
        </p>

        <div class="flex flex-col gap-2">
          <div v-for="field in FIELDS" :key="field.key" class="flex items-center gap-2">
            <span class="w-28 shrink-0 text-sm text-(--color-text-2)">{{ field.label }}</span>
            <KInput v-model="keywords[field.key]" placeholder="杭州 或 330100" :disabled="busy" />
          </div>
        </div>

        <label class="flex items-center gap-2 text-xs text-(--color-text-2)">
          <input v-model="ignoreCache" type="checkbox" :disabled="busy" />
          忽略缓存重新取数（区划变动时用：清掉本机边界缓存，并让 Worker 绕过 KV 缓存重新拉）
        </label>

        <div class="flex flex-wrap items-center gap-3">
          <KButton
            class="px-3! py-2! disabled:opacity-50"
            :disabled="busy || !keywords.resident.trim()"
            @click="generate">
            {{ busy ? '处理中…' : '出图' }}
          </KButton>
          <span v-if="phase" class="text-xs text-(--color-text-3)">{{ phase }}</span>
        </div>
      </div>
    </KCard>

    <KCard v-if="results.length" title="出图结果">
      <div class="flex flex-col gap-4">
        <div v-for="row in results" :key="row.adcode" class="flex flex-col gap-2 sm:flex-row">
          <div class="overflow-hidden rounded-lg border border-(--color-line-strong) sm:w-64">
            <img class="w-full" :src="row.map.previewUrl" :alt="row.map.name" />
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <p class="text-sm">
              {{ row.labels.join(' / ') }}：{{ row.map.name }}
              <span class="text-xs text-(--color-text-3)">{{ row.map.adcode }}</span>
            </p>
            <p v-for="(note, i) in row.map.notes" :key="i" class="text-xs text-(--color-text-3)">
              {{ note }}
            </p>
            <p v-if="!row.map.notes.length" class="text-xs text-(--color-text-3)">无提示。</p>
          </div>
        </div>

        <p class="text-xs text-(--color-text-3)">
          确认预览没问题后再应用：图传到 R2
          <code>img/site/map/&lt;adcode&gt;.svg</code>，城市配置写进 KV；<code>/api/city</code> 的
          <code>resident</code> 随即生效（CDN 缓存最长 30 分钟）。
        </p>
        <div class="flex items-center gap-3">
          <KButton class="px-3! py-2! disabled:opacity-50" :disabled="busy" @click="applyMaps">
            上传并应用
          </KButton>
        </div>
      </div>
    </KCard>
  </div>
</template>
