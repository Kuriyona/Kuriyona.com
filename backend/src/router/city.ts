import type { Handler } from 'hono';
import { AMAP_DISTRICT_API, cityCenter } from '../amap';
import {
  CITY_MAPS_KEY,
  cityEntry,
  cityMapObjectKey,
  cityMapUrl,
  parseCityRef,
  readCityMaps,
  type CityRef,
} from '../city-map';
import type { Env } from '../env';
import { presignR2Put } from '../utils';

type H = Handler<{ Bindings: Env }>;

// ── 天气（跟着常住城市走）──
const weatherHost = 'https://nb2mt9vk5n.re.qweatherapi.com';

// 上游缓存的新鲜期（秒）；KV 实际 TTL 取 2 倍，上游失败时回退旧值
const WEATHER_TTL = 1800;

// 取不到常住城市中心点（缺 AMAP_KEY / 上游失败）时的回退：默认城市（杭州，见 city-map.ts
// 的 DEFAULT_CITY）的中心点。QWeather 的 location 支持 LocationID 与 `经度,纬度` 两种写法。
const FALLBACK_WEATHER_LOCATION = '120.21,30.25';

interface CacheEntry<T> {
  at: number;
  data: T;
}

// 只剩天气一个调用者，故不再保留泛型 readCache/writeCache：键固定 `cache:weather:<adcode>`
const readWeatherCache = async (env: Env, adcode: string) => {
  const raw = await env.STATUS_KV.get(`cache:weather:${adcode}`);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<unknown>;
    return { data: entry.data, fresh: Date.now() - entry.at < WEATHER_TTL * 1000 };
  } catch {
    return null;
  }
};

const writeWeatherCache = async (env: Env, adcode: string, data: unknown) => {
  await env.STATUS_KV.put(
    `cache:weather:${adcode}`,
    JSON.stringify({ at: Date.now(), data } satisfies CacheEntry<unknown>),
    { expirationTtl: WEATHER_TTL * 2 },
  );
};

/** 按**常住城市**的中心点查实时天气；缓存按 adcode 分键，换城市立即生效 */
const updateWeather = async (env: Env, city: CityRef): Promise<unknown> => {
  const cached = await readWeatherCache(env, city.adcode);
  if (cached?.fresh) return cached.data;
  if (!env.WEATHER_API_KEY) return cached?.data ?? {};

  const location = (await cityCenter(env, city.adcode)) ?? FALLBACK_WEATHER_LOCATION;
  try {
    const res = await fetch(`${weatherHost}/v7/weather/now?location=${location}`, {
      headers: { 'X-QW-Api-Key': env.WEATHER_API_KEY },
    });
    if (!res.ok) return cached?.data ?? {};
    const data: unknown = await res.json();
    await writeWeatherCache(env, city.adcode, data);
    return data;
  } catch {
    return cached?.data ?? {};
  }
};

// ── 城市（公开读 / 管理端写）──
// 天气是**常住城市**的实时数据，嵌在 resident 上；current 只有配置（`PUT` 的响应不带天气）。
export const getCity: H = async (c) => {
  c.header('cache-control', 'public, max-age=1800');
  const cities = await readCityMaps(c.env);
  const weather = await updateWeather(c.env, cities.resident);
  return c.json({ resident: { ...cities.resident, weather }, current: cities.current });
};

export const putCity: H = async (c) => {
  let body: { resident?: unknown; current?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ message: 'Invalid body' }, 400);
  }
  const resident = parseCityRef(body?.resident);
  // 两地相同是常态：不传 current 就跟随 resident
  const current = parseCityRef(body?.current ?? body?.resident);
  if (!resident || !current) return c.json({ message: 'Invalid body' }, 400);

  await c.env.STATUS_KV.put(CITY_MAPS_KEY, JSON.stringify({ resident, current }));
  return c.json({ resident: cityEntry(resident), current: cityEntry(current) });
};

// ── 出图链路（管理端）──
// 出图跑在管理端浏览器里（见 backend/docs/city-map.md），Worker 只做三件薄事。
const AMAP_JSON = 'application/json;charset=UTF-8';
// 边界数据几乎不动，缓存 30 天；键是「参数字符串」，值就是上游响应原文
const AMAP_CACHE_PREFIX = 'amap:';
const AMAP_CACHE_TTL = 60 * 60 * 24 * 30;

// 1) 转发高德查询：注入 key、缓存边界。CPU 只有 URL 拼接 + 一次 KV 读写。
export const amapProxy: H = async (c) => {
  const key = c.env.AMAP_KEY;
  if (!key) return c.json({ message: '[config] 缺少必需的环境变量: AMAP_KEY' }, 500);

  // 客户端给的查询参数原样转发，但本地参数一律剔除：`key` 是客户端不该带的（用 Worker 侧那把），
  // `auth` 是本服务的鉴权参数（绝不能出现在上游请求与缓存键里 —— 它就是我们自己的 AUTH_KEY），
  // `nocache` 是本地开关。
  const params = new URLSearchParams(c.req.query());
  const noCache = params.has('nocache');
  for (const local of ['key', 'auth', 'nocache']) params.delete(local);
  // 排序后再做缓存键：同一组查询只留一条缓存，不受参数顺序影响
  params.sort();
  const cacheKey = `${AMAP_CACHE_PREFIX}${params.toString()}`;

  const cached = noCache ? null : await c.env.STATUS_KV.get(cacheKey);
  if (cached) return c.body(cached, 200, { 'content-type': AMAP_JSON });

  const upstream = new URL(AMAP_DISTRICT_API);
  upstream.search = params.toString();
  upstream.searchParams.set('key', key);
  let res: Response;
  try {
    res = await fetch(upstream, { signal: AbortSignal.timeout(10_000) });
  } catch {
    return c.json({ message: 'Amap 上游请求失败' }, 502);
  }
  if (!res.ok) return c.json({ message: `Amap 上游失败（HTTP ${res.status}）` }, 502);

  const text = await res.text();
  // 只缓存成功响应：限流/配额报错不该被记住 30 天
  try {
    if ((JSON.parse(text) as { status?: string }).status === '1') {
      await c.env.STATUS_KV.put(cacheKey, text, { expirationTtl: AMAP_CACHE_TTL });
    }
  } catch {
    // 上游给了非 JSON：原样透传，交由客户端判断
  }
  return c.body(text, 200, { 'content-type': AMAP_JSON });
};

// 2) 签发上传地址：浏览器直传 R2，Worker 不搬运 SVG 字节（搬运就得算 SigV4 的 payload hash）。
export const cityMapUploadUrl: H = async (c) => {
  const adcode = c.req.query('adcode') ?? '';
  if (!/^\d{6}$/.test(adcode)) return c.json({ message: 'Invalid adcode' }, 400);
  const key = cityMapObjectKey(adcode);
  // mime 会一起进签名，客户端 PUT 必须原样带上同一个 Content-Type
  const url = await presignR2Put(c.env, key, 'image/svg+xml');
  return c.json({ url, key, publicUrl: cityMapUrl(adcode) });
};
