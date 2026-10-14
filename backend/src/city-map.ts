import type { Env } from './env';

export interface CityRef {
  name: string;
  adcode: string;
}

export interface CityEntry extends CityRef {
  map: string;
}

export interface CityMaps {
  resident: CityEntry;
  current: CityEntry;
}

// 城市配置只占 KV 这一个键（管理端出图后写入），GET /status 优先读它、缺失或坏值时回退默认值
export const CITY_MAPS_KEY = 'city:maps';

export const DEFAULT_CITY: CityRef = { name: '杭州', adcode: '330100' };

// 出图是 R2 上的静态对象，键不在 `static/` 前缀下（见 backend/docs/status-map.md）
export const cityMapObjectKey = (adcode: string) => `img/site/map/${adcode}.svg`;

export const cityMapUrl = (adcode: string) => `https://r2.kuriyona.com/${cityMapObjectKey(adcode)}`;

export const cityEntry = (city: CityRef): CityEntry => ({ ...city, map: cityMapUrl(city.adcode) });

export const defaultCityMaps = (): CityMaps => ({
  resident: cityEntry(DEFAULT_CITY),
  current: cityEntry(DEFAULT_CITY),
});

// 校验并规整请求体里的城市：adcode 必须是 6 位数字，它决定 R2 对象键，不能含糊
export const parseCityRef = (value: unknown): CityRef | null => {
  if (!value || typeof value !== 'object') return null;
  const { name, adcode } = value as { name?: unknown; adcode?: unknown };
  if (typeof name !== 'string' || !name.trim()) return null;
  if (typeof adcode !== 'string' || !/^\d{6}$/.test(adcode)) return null;
  return { name: name.trim(), adcode };
};

export const readCityMaps = async (env: Env): Promise<CityMaps> => {
  const raw = await env.STATUS_KV.get(CITY_MAPS_KEY);
  if (raw) {
    try {
      const stored = JSON.parse(raw) as Partial<CityMaps>;
      if (stored?.resident?.adcode && stored?.current?.adcode) return stored as CityMaps;
    } catch {
      // 坏值按未配置处理，走默认城市
    }
  }
  return defaultCityMaps();
};
