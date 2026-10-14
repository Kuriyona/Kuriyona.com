<script setup lang="ts">
import { useStorage } from '@vueuse/core';

definePageMeta({ layout: 'admin' });

interface Zone {
  id: string;
  name: string;
  status?: string;
  plan?: string;
}

type PurgeType = 'url' | 'hostname' | 'tag' | 'prefix';

// 与 backend/src/router/cache.ts 的 PURGE_FIELD 一一对应
const MODES = [
  {
    value: 'url',
    title: 'URL',
    desc: '清除与 URL 精确匹配的资源（不支持通配符）。',
    placeholder: 'https://r2.kuriyona.com/img/site/map/330100.svg\nhttps://kuriyona.com/',
    hint: '每行一个完整 URL，含 https://。',
  },
  {
    value: 'hostname',
    title: '主机名',
    desc: '主机名与所填值匹配的所有 URL 上的资源都会从缓存中清除。',
    placeholder: 'r2.kuriyona.com',
    hint: '裸主机名：不带协议与路径。HTTP 与 HTTPS 会一起清除。',
  },
  {
    value: 'tag',
    title: '标签',
    desc: '凡是用到匹配的 Cache-Tag 响应标头的资源都会从缓存中清除。',
    placeholder: 'site-map',
    hint: '需要源站返回 Cache-Tag 响应头，否则没有可清的对象。',
  },
  {
    value: 'prefix',
    title: '前缀',
    desc: 'URL 以该前缀开头的资源都会从缓存中清除。',
    placeholder: 'r2.kuriyona.com/img/site/',
    hint: '主机名 + 路径：不带协议、查询串或锚点。',
  },
] as const satisfies readonly {
  value: PurgeType;
  title: string;
  desc: string;
  placeholder: string;
  hint: string;
}[];

// Cloudflare 的单次上限（Free/Pro/Business 都是 100 条操作）
const MAX_TARGETS = 100;

const { data, error: zonesError } = useAsyncData(
  'admin-cache-zones',
  () => fetchApi.get('/cache/zones').json<{ zones: Zone[] }>(),
  { server: false, lazy: true },
);

const zones = computed(() => data.value?.zones ?? []);
const zoneOptions = computed(() =>
  zones.value.map((z) => ({ value: z.id, label: z.plan ? `${z.name} · ${z.plan}` : z.name })),
);

// 选中的 zone 存本机：默认取与当前站点同域的 zone，没有就取第一个
const zone = useStorage('CF_PURGE_ZONE', '');
// token 缺 Zone:Read 时列表拉不到，改手填 zone id 或域名
const manualZone = ref('');
const zoneTarget = computed(() => (zone.value || manualZone.value).trim());

watch(zones, (list) => {
  if (!list.length || list.some((z) => z.id === zone.value)) return;
  const host = location.hostname.split('.').slice(-2).join('.');
  zone.value = (list.find((z) => z.name === host) ?? list[0])!.id;
});

const mode = ref<PurgeType>('url');
const currentMode = computed(() => MODES.find((m) => m.value === mode.value)!);
const input = ref('');
const busy = ref(false);

const targets = computed(() => [
  ...new Set(
    input.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  ),
]);

// 最近清除：只存在本机（Cloudflare 不提供清除历史接口）
interface RecentEntry {
  value: string;
  type: PurgeType;
  at: number;
}
const recent = useStorage<RecentEntry[]>('CF_PURGE_RECENT', []);

const reuse = (entry: RecentEntry) => {
  mode.value = entry.type;
  input.value = [...new Set([...targets.value, entry.value])].join('\n');
};

const submit = async () => {
  if (!zoneTarget.value || !targets.value.length || busy.value) return;
  busy.value = true;
  try {
    const res = await fetchApi
      .post('/cache/purge', {
        json: { zone: zoneTarget.value, type: mode.value, targets: targets.value },
      })
      .json<{ purged: number }>();
    toast.success(`已提交 ${res.purged} 条清除请求`);
    const at = Date.now();
    const added = targets.value.map((value) => ({ value, type: mode.value, at }));
    const merged = [
      ...added,
      ...recent.value.filter((r) => !added.some((a) => a.value === r.value)),
    ];
    recent.value = merged.slice(0, 12);
    input.value = '';
  } catch (e) {
    toast.error(await adminErrorMessage(e));
  } finally {
    busy.value = false;
  }
};

const reset = () => {
  input.value = '';
  if (zonesError.value) manualZone.value = '';
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <KCard title="自定义清除">
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <p class="text-xs text-(--color-text-3)">
            清除范围是域名（Cloudflare zone）。下拉里是 token
            能看到的全部域名，选哪个就清哪个；token 拿不到域名列表 时（缺 Zone:Read）可以直接填 zone
            id 或域名。
          </p>
          <div class="flex items-center gap-2">
            <span class="w-16 shrink-0 text-sm text-(--color-text-2)">域名</span>
            <KSelect
              v-if="zoneOptions.length"
              v-model="zone"
              :options="zoneOptions"
              class="flex-1" />
            <KInput
              v-else
              v-model="manualZone"
              placeholder="域名（kuriyona.com）或 zone id"
              class="flex-1" />
          </div>
          <p v-if="zoneTarget" class="text-xs text-(--color-text-4)">zone：{{ zoneTarget }}</p>
          <p v-else-if="zonesError" class="text-xs text-red-400">
            域名列表加载失败：{{ adminErrorText(zonesError) }}
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-sm text-(--color-text-2)">清除方式：</p>
          <div class="flex flex-col gap-2" role="radiogroup" aria-label="清除方式">
            <label
              v-for="m in MODES"
              :key="m.value"
              class="k-interactive flex cursor-pointer gap-3 rounded-lg border p-3"
              :class="
                mode === m.value
                  ? 'border-(--color-theme)! bg-(--color-hover)'
                  : 'border-(--color-line-strong)'
              ">
              <input v-model="mode" type="radio" :value="m.value" class="sr-only" />
              <span
                class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border"
                :class="mode === m.value ? 'border-(--color-theme)' : 'border-(--color-text-3)'">
                <span v-if="mode === m.value" class="size-2.5 rounded-full bg-(--color-theme)" />
              </span>
              <span class="flex min-w-0 flex-col gap-1">
                <span class="text-sm font-bold">{{ m.title }}</span>
                <span class="text-xs text-(--color-text-3)">{{ m.desc }}</span>
              </span>
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-xs text-(--color-text-3)">
            {{ currentMode.hint }} 一次最多 {{ MAX_TARGETS }} 条，按每行一条分隔。
          </p>
          <KInput
            v-model="input"
            textarea
            :rows="6"
            :placeholder="currentMode.placeholder"
            :disabled="busy"
            class="font-monos" />
          <p class="text-xs text-(--color-text-4)">
            待清除 {{ targets.length }} 条<template v-if="input.trim() && !targets.length"
              >（还没有有效条目）</template
            >
          </p>
        </div>

        <div v-if="recent.length" class="flex flex-col gap-2">
          <p class="text-xs text-(--color-text-2)">最新清除时间：</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="entry in recent"
              :key="entry.value"
              type="button"
              class="k-interactive max-w-full truncate rounded-full border border-(--color-control-border) bg-(--color-control-bg) px-3 py-1 text-xs text-(--color-text-1)"
              :title="`${entry.value}｜${MODES.find((m) => m.value === entry.type)?.title}`"
              @click="reuse(entry)">
              {{ entry.value }}
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <KButton class="px-3! py-2!" :disabled="busy" @click="reset">取消</KButton>
          <KButton
            class="px-3! py-2! disabled:opacity-50"
            :disabled="busy || !targets.length || !zoneTarget"
            @click="submit">
            {{ busy ? '提交中…' : '清除' }}
          </KButton>
        </div>
      </div>
    </KCard>

    <KCard title="验证与限制">
      <ul class="flex list-disc flex-col gap-2 pl-5 text-xs text-(--color-text-3)">
        <li>
          200 只代表 Cloudflare 收下了请求。验证方式：再请求一次该资源，看
          <code>CF-Cache-Status</code> 不再是 <code>HIT</code>。
        </li>
        <li>单个 URL 清除不支持通配符；主机名 / 标签 / 前缀清除在 Free 计划下是 5 次/分钟。</li>
        <li>
          R2 的对象键与公开地址不同名时清公开地址：例如地图对象
          <code>img/site/map/330100.svg</code> 的公开地址是
          <code>https://r2.kuriyona.com/img/site/map/330100.svg</code>（与站点同属一个 zone）。
        </li>
      </ul>
    </KCard>
  </div>
</template>
