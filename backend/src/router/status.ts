import type { Handler } from 'hono';
import type { Env } from '../env';

type H = Handler<{ Bindings: Env }>;

// KV 键前缀：`dynamic:` 为 POST 写入的动态数据，`cache:` 为上游接口缓存
const DYNAMIC_PREFIX = 'dynamic:';
const CACHE_PREFIX = 'cache:';

// 上游缓存的新鲜期（秒）；KV 实际 TTL 取 2 倍，上游失败时回退旧值
const WEATHER_TTL = 1800;
const GITHUB_TTL = 60;
const STEAM_TTL = 60;

// ── 城市地图（固定值）──
// SVG 由离线脚本出图后上传到 R2，键 `img/site/map/<adcode>.svg`（见 backend/docs/status-map.md）。
// 目前常住城市与当前所在城市都是杭州，Worker 侧不做任何生成。
const CITY = { name: '杭州', adcode: '330100' };
const CITY_MAP = { ...CITY, map: `https://r2.kuriyona.com/img/site/map/${CITY.adcode}.svg` };
const CITY_MAPS = { resident: CITY_MAP, current: CITY_MAP };

export interface SteamInfo {
  personaName: string;
  personaState: number;
  realName: string;
  gameExtraInfo: string;
  gameId: string;
}

interface CacheEntry<T> {
  at: number;
  data: T;
}

// 上游接口响应形状（GitHub Events / Steam Web API），在 fetch 边界断言一次
interface GitHubEvent {
  type?: string;
  repo?: { name?: string };
  created_at?: string;
}

interface SteamPlayerSummary {
  personaname?: string;
  personastate?: number;
  realname?: string;
  gameextrainfo?: string;
  gameid?: string;
}

interface SteamPlayerSummariesResponse {
  response?: { players?: SteamPlayerSummary[] };
}

// 缓存条目统一编码为 { at, data }：at 判断新鲜度，TTL 未到期前可作上游失败时的回退值
const readCache = async <T>(
  env: Env,
  name: string,
  ttl: number,
): Promise<{ data: T; fresh: boolean } | null> => {
  const raw = await env.STATUS_KV.get(`${CACHE_PREFIX}${name}`);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    return { data: entry.data, fresh: Date.now() - entry.at < ttl * 1000 };
  } catch {
    return null;
  }
};

const writeCache = async (env: Env, name: string, data: unknown, ttl: number) => {
  await env.STATUS_KV.put(
    `${CACHE_PREFIX}${name}`,
    JSON.stringify({ at: Date.now(), data } satisfies CacheEntry<unknown>),
    { expirationTtl: ttl * 2 },
  );
};

// ── Weather ──
const weatherHost = 'https://nb2mt9vk5n.re.qweatherapi.com';

const updateWeather = async (env: Env): Promise<unknown> => {
  const cached = await readCache<unknown>(env, 'weather', WEATHER_TTL);
  if (cached?.fresh) return cached.data;
  if (!env.WEATHER_API_KEY) return cached?.data ?? {};

  try {
    const res = await fetch(`${weatherHost}/v7/weather/now?location=101210107`, {
      headers: { 'X-QW-Api-Key': env.WEATHER_API_KEY },
    });
    if (!res.ok) return cached?.data ?? {};
    const data: unknown = await res.json();
    await writeCache(env, 'weather', data, WEATHER_TTL);
    return data;
  } catch {
    return cached?.data ?? {};
  }
};

// ── GitHub Activity ──
const githubUsername = 'Kuriyona';

const updateGitHubActivity = async (env: Env): Promise<Record<string, string>> => {
  const cached = await readCache<Record<string, string>>(env, 'github', GITHUB_TTL);
  if (cached?.fresh) return cached.data;
  if (!env.GITHUB_API_TOKEN) return cached?.data ?? {};

  try {
    const res = await fetch(`https://api.github.com/users/${githubUsername}/events?per_page=100`, {
      headers: { Authorization: `Bearer ${env.GITHUB_API_TOKEN}`, 'User-Agent': 'kuriyona-api' },
    });
    if (!res.ok) return cached?.data ?? {};
    const events = (await res.json()) as GitHubEvent[];
    if (!Array.isArray(events)) return cached?.data ?? {};

    // 每个仓库取最新一条 push（events 按时间倒序）
    const data: Record<string, string> = {};
    for (const event of events) {
      const repo = event?.repo?.name;
      if (event?.type !== 'PushEvent' || typeof repo !== 'string' || repo in data) continue;
      data[repo] = event.created_at ?? '';
    }
    await writeCache(env, 'github', data, GITHUB_TTL);
    return data;
  } catch {
    return cached?.data ?? {};
  }
};

// ── Steam ──
const steamId = '76561199158556744';

const updateSteam = async (env: Env): Promise<SteamInfo | null> => {
  const cached = await readCache<SteamInfo>(env, 'steam', STEAM_TTL);
  if (cached?.fresh) return cached.data;
  if (!env.STEAM_API_KEY) return cached?.data ?? null;

  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${env.STEAM_API_KEY}&steamids=${steamId}`,
    );
    if (!res.ok) return cached?.data ?? null;
    const body = (await res.json()) as SteamPlayerSummariesResponse;
    const player = body?.response?.players?.[0];
    if (!player) return cached?.data ?? null;

    const data: SteamInfo = {
      personaName: player.personaname ?? '',
      personaState: player.personastate ?? 0,
      realName: player.realname ?? '',
      gameExtraInfo: player.gameextrainfo ?? '',
      gameId: player.gameid ?? '',
    };
    await writeCache(env, 'steam', data, STEAM_TTL);
    return data;
  } catch {
    return cached?.data ?? null;
  }
};

// ── 动态数据（`dynamic:` 前缀）──
const readDynamic = async (env: Env): Promise<Record<string, unknown>> => {
  const dynamic: Record<string, unknown> = {};
  let cursor: string | undefined;
  do {
    const list = await env.STATUS_KV.list({ prefix: DYNAMIC_PREFIX, cursor });
    const values = await Promise.all(list.keys.map((k) => env.STATUS_KV.get(k.name)));
    list.keys.forEach((k, i) => {
      const raw = values[i];
      if (raw === null) return;
      const key = k.name.slice(DYNAMIC_PREFIX.length);
      try {
        dynamic[key] = JSON.parse(raw);
      } catch {
        dynamic[key] = raw;
      }
    });
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return dynamic;
};

const deleteDynamic = async (env: Env) => {
  let cursor: string | undefined;
  do {
    const list = await env.STATUS_KV.list({ prefix: DYNAMIC_PREFIX, cursor });
    await Promise.all(list.keys.map((k) => env.STATUS_KV.delete(k.name)));
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
};

// ── Routes ──
export const getStatus: H = async (c) => {
  c.header('cache-control', 'public, max-age=1800');
  const [weather, githubActivity, steam, dynamic] = await Promise.all([
    updateWeather(c.env),
    updateGitHubActivity(c.env),
    updateSteam(c.env),
    readDynamic(c.env),
  ]);
  return c.json({
    weather,
    github_activity: githubActivity,
    steam,
    // 固定值，排在动态数据之后：即使 KV 里被写进了同名键也以它为准
    ...dynamic,
    cities: CITY_MAPS,
  });
};

export const postStatus: H = async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid body' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ message: 'Invalid body' }, 400);
  }
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      c.env.STATUS_KV.put(`${DYNAMIC_PREFIX}${key}`, JSON.stringify(value)),
    ),
  );
  return c.json({ message: 'ok' });
};

export const deleteStatus: H = async (c) => {
  const key = c.req.query('key');
  if (key) {
    const keys = key
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    await Promise.all(keys.map((k) => c.env.STATUS_KV.delete(`${DYNAMIC_PREFIX}${k}`)));
  } else {
    await deleteDynamic(c.env);
  }
  return c.json({ message: 'ok' });
};
