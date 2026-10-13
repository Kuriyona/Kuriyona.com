import { AmapBox, type AmapCache, type SpanOptions } from '@kuriyona/amap-box';
import type { Env } from './env';
import { putR2 } from './utils';

/** R2 公开域名（桶 `kuriyona-r2` 的自定义域）；对象键 = 域名后的路径 */
const R2_PUBLIC_BASE = 'https://r2.kuriyona.com/';
/** 地图对象键前缀：`img/site/map/<adcode>.svg` */
const MAP_KEY_PREFIX = 'img/site/map/';

/** 出图参数版本：改 `MAP_SPAN` 后 +1，已出图的城市会自动重出 */
const MAP_VERSION = 1;

/**
 * 出图参数，等价于 CLI：
 * `--up 1 --down 0 --ratio 1 --outside-same-level --no-title --no-context-labels --no-target-label --center target`
 *
 * 画幅固定 1:1 且目标（城市）居中，前端再按容器比例裁切（2:1 ~ 1:2 之间目标都不会丢）。
 */
const MAP_SPAN: SpanOptions = {
  up: 1,
  down: 0,
  ratio: 1,
  outsideSameLevel: true,
  title: false,
  contextLabels: false,
  targetLabels: false,
  center: 'target',
};

/** 出图互斥锁 TTL（秒）：`waitUntil` 最多续命 30s，出图可能被截断，锁过期后下一次请求接着出 */
const LOCK_TTL = 60;

export interface CityConfig {
  name: string;
  adcode: string;
}

export interface CityMap extends CityConfig {
  /** R2 公开地址 */
  map: string;
  /** 是否已出图并写入 R2 */
  ready: boolean;
}

export interface Cities {
  resident: CityMap;
  current: CityMap;
}

/** KV 里的默认城市（KV 无 `dynamic:cities` 时用） */
export const DEFAULT_CITIES: Record<'resident' | 'current', CityConfig> = {
  resident: { name: '杭州', adcode: '330100' },
  current: { name: '杭州', adcode: '330100' },
};

/**
 * AmapBox 的缓存落在 KV：全国索引（`amap:index`）与单个行政区边界（`amap:<adcode>`）。
 * 值上限 25MiB，实测单条最大约 1MB；不同 key 之间没有 1 写/秒 的限制，够用。
 */
const kvCache = (env: Env): AmapCache => ({
  read: (key) => env.STATUS_KV.get(`amap:${key}`),
  write: (key, value) => env.STATUS_KV.put(`amap:${key}`, value),
});

const asCity = (value: unknown, fallback: CityConfig): CityConfig => {
  if (!value || typeof value !== 'object') return fallback;
  const { name, adcode } = value as Record<string, unknown>;
  if (typeof adcode !== 'string' || !/^\d{6}$/.test(adcode)) return fallback;
  return { name: typeof name === 'string' && name.trim() ? name.trim() : adcode, adcode };
};

/** 把 KV 里的 `dynamic:cities` 归一化成两个合法城市，缺失/非法一律回退默认值 */
export const normalizeCities = (raw: unknown): Record<'resident' | 'current', CityConfig> => {
  const value = (raw ?? {}) as Record<string, unknown>;
  return {
    resident: asCity(value.resident, DEFAULT_CITIES.resident),
    current: asCity(value.current, DEFAULT_CITIES.current),
  };
};

/** 城市地图是否已出图（标记存在且参数版本一致） */
export const isMapReady = async (env: Env, adcode: string) => {
  const raw = await env.STATUS_KV.get(`amap:map:${adcode}`);
  if (!raw) return false;
  try {
    return (JSON.parse(raw) as { v?: number }).v === MAP_VERSION;
  } catch {
    return false;
  }
};

/** 出图 → 写 R2 → 打标记。失败只记录日志（调用方在 `waitUntil` 里跑，不影响响应） */
export const generateCityMap = async (env: Env, adcode: string) => {
  try {
    const box = new AmapBox({
      Key: env.AMAP_KEY,
      fetch: (url) => fetch(url).then((r) => r.json()),
      cache: kvCache(env),
    });
    const [result] = await box.generate(adcode, MAP_SPAN);
    if (!result?.svg) {
      console.error(`[map] ${adcode} 未出图:`, result?.notes.join(' / '));
      return;
    }
    await putR2(env, `${MAP_KEY_PREFIX}${adcode}.svg`, result.svg, 'image/svg+xml');
    await env.STATUS_KV.put(
      `amap:map:${adcode}`,
      JSON.stringify({ v: MAP_VERSION, at: Date.now(), landed: result.landed }),
    );
  } catch (e) {
    console.error(`[map] ${adcode} 出图失败:`, e);
  }
};

/** 未出图时排一次后台出图；锁未过期（出图中/刚失败）则跳过 */
export const scheduleCityMap = async (ctx: ExecutionContext, env: Env, adcode: string) => {
  if (await isMapReady(env, adcode)) return;
  if (await env.STATUS_KV.get(`amap:lock:${adcode}`)) return;
  await env.STATUS_KV.put(`amap:lock:${adcode}`, '1', { expirationTtl: LOCK_TTL });
  ctx.waitUntil(generateCityMap(env, adcode));
};

/** 组装 `/status` 返回的城市信息，顺带把没出图的城市排进后台 */
export const resolveCities = async (
  ctx: ExecutionContext,
  env: Env,
  raw: unknown,
): Promise<Cities> => {
  const cities = normalizeCities(raw);
  const ensure = async (city: CityConfig): Promise<CityMap> => {
    const ready = await isMapReady(env, city.adcode);
    if (!ready) await scheduleCityMap(ctx, env, city.adcode);
    return { ...city, map: `${R2_PUBLIC_BASE}${MAP_KEY_PREFIX}${city.adcode}.svg`, ready };
  };
  const [resident, current] = await Promise.all([ensure(cities.resident), ensure(cities.current)]);
  return { resident, current };
};
