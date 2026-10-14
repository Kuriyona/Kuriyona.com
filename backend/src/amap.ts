import type { Env } from './env';

// 上游：高德行政区划查询（Web 服务）。key 只存在 Worker 侧 —— 不下发到浏览器、不进前端 bundle。
export const AMAP_DISTRICT_API = 'https://restapi.amap.com/v3/config/district';

// 城市中心点缓存：区划中心几乎不动，与边界缓存同一寿命（30 天）。
// 值是 `经度,纬度` 字符串本身（不是 `cache:*` 的 `{ at, data }`）—— 它没有新鲜期概念，靠 TTL 兜底。
const CENTER_CACHE_PREFIX = 'amap:center:';
const CENTER_TTL = 60 * 60 * 24 * 30;

interface DistrictResponse {
  districts?: { center?: string }[];
}

/**
 * 查 adcode 对应城市的中心点，返回 QWeather `location` 参数要的 `经度,纬度`（两位小数）。
 * `AMAP_KEY` 缺失、上游失败或响应里没有 center 时返回 `null`，由调用方决定回退。
 * 注：高德 center 是 GCJ-02，与 QWeather 的坐标基准最多差数百米，城市级天气无影响。
 */
export const cityCenter = async (env: Env, adcode: string): Promise<string | null> => {
  const cacheKey = `${CENTER_CACHE_PREFIX}${adcode}`;
  const cached = await env.STATUS_KV.get(cacheKey);
  if (cached) return cached;
  if (!env.AMAP_KEY) return null;

  const url = new URL(AMAP_DISTRICT_API);
  url.searchParams.set('keywords', adcode);
  url.searchParams.set('subdistrict', '0');
  url.searchParams.set('key', env.AMAP_KEY);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const { districts } = (await res.json()) as DistrictResponse;
    const center = districts?.[0]?.center;
    if (!center) return null;
    const [lng, lat] = center.split(',').map(Number);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    // QWeather 的 location 只认小数点后两位
    const location = `${lng.toFixed(2)},${lat.toFixed(2)}`;
    await env.STATUS_KV.put(cacheKey, location, { expirationTtl: CENTER_TTL });
    return location;
  } catch {
    return null;
  }
};
