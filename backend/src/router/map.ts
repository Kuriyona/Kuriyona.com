import type { Handler } from 'hono';
import { AMAP_DISTRICT_API } from '../amap';
import type { Env } from '../env';
import {
  CITY_MAPS_KEY,
  cityEntry,
  cityMapObjectKey,
  cityMapUrl,
  parseCityRef,
  type CityRef,
} from '../city-map';
import { presignR2Put } from '../utils';

type H = Handler<{ Bindings: Env }>;

const AMAP_JSON = 'application/json;charset=UTF-8';
// 边界数据几乎不动，缓存 30 天；键是「参数字符串」，值就是上游响应原文
const AMAP_CACHE_PREFIX = 'amap:';
const AMAP_CACHE_TTL = 60 * 60 * 24 * 30;

/** 出图跑在管理端浏览器里（见 backend/docs/status-map.md），Worker 只做三件薄事。 */

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

// 3) 写城市配置：两个城市 + 各自的 R2 地址，GET /status 直接读这个键
export const putCities: H = async (c) => {
  let body: { resident?: unknown; current?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ message: 'Invalid body' }, 400);
  }
  const resident: CityRef | null = parseCityRef(body?.resident);
  // 两地相同是常态：不传 current 就跟随 resident
  const current: CityRef | null = parseCityRef(body?.current ?? body?.resident);
  if (!resident || !current) return c.json({ message: 'Invalid body' }, 400);

  const cities = { resident: cityEntry(resident), current: cityEntry(current) };
  await c.env.STATUS_KV.put(CITY_MAPS_KEY, JSON.stringify(cities));
  return c.json(cities);
};
