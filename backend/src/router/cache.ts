import type { Context, Handler } from 'hono';
import type { Env } from '../env';

type H = Handler<{ Bindings: Env }>;

// ── Cloudflare 缓存清除（管理端）──
// Worker 只做两件薄事：列 token 可见的 zone（域名下拉），以及把清除请求转发给 Cloudflare。
// token 走 `CF_API_TOKEN`，只存在 Worker 侧（浏览器拿不到，见 backend/docs/cache-purge.md）。
const CF_API = 'https://api.cloudflare.com/client/v4';

// 单次请求上限：Free/Pro/Business 都是 100 条操作（Cloudflare「Purge cache · 可用性与限制」）
const MAX_TARGETS = 100;

// 清除方式 → purge_cache 请求体的字段名
const PURGE_FIELD = {
  url: 'files',
  hostname: 'hosts',
  tag: 'tags',
  prefix: 'prefixes',
} as const;

type PurgeType = keyof typeof PURGE_FIELD;

const ZONE_ID = /^[0-9a-f]{32}$/i;
const HOSTNAME = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

interface CfError {
  code: number;
  message: string;
}

interface CfEnvelope<T> {
  success: boolean;
  errors?: CfError[];
  result?: T | null;
  result_info?: { page?: number; total_pages?: number };
}

const missingToken = (c: Context) =>
  c.json({ message: '[config] 缺少必需的环境变量: CF_API_TOKEN' }, 500);

const cfErrors = (errors: CfError[] | undefined, fallback: string) =>
  errors?.length ? errors.map((e) => `${e.message}（${e.code}）`).join('；') : fallback;

/** 转发到 Cloudflare API；网络/上游异常交给调用点转成 502 */
const cfFetch = async (token: string, path: string, init?: RequestInit) => {
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...init?.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  return (await res.json()) as CfEnvelope<unknown>;
};

/** zone 既接受 32 位 zone id，也接受域名（按 /zones?name= 查一次） */
const resolveZoneId = async (token: string, zone: string) => {
  if (ZONE_ID.test(zone)) return { id: zone.toLowerCase() } as const;
  const res = await cfFetch(token, `/zones?per_page=50&name=${encodeURIComponent(zone)}`);
  if (!res.success) return { error: cfErrors(res.errors, 'Cloudflare 查询域名失败') } as const;
  const [hit] = (res.result ?? []) as { id: string }[];
  return { id: hit?.id ?? null } as const;
};

/** 逐行拆条目：去空行、去重、按方式校验（非法的一条都不放行） */
const parseTargets = (input: unknown, type: PurgeType) => {
  const lines = (Array.isArray(input) ? input : [])
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
  if (!lines.length) return { error: '请至少填写一条内容' } as const;

  const values = [...new Set(lines)];
  if (values.length > MAX_TARGETS) {
    return { error: `一次最多 ${MAX_TARGETS} 条，当前 ${values.length} 条` } as const;
  }
  for (const value of values) {
    if (type === 'url') {
      const ok = (() => {
        try {
          const url = new URL(value);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      })();
      if (!ok) return { error: `URL 需为完整地址（含 http:// 或 https://）：${value}` } as const;
    } else if (type === 'hostname' && !HOSTNAME.test(value)) {
      return { error: `主机名格式不对（不含协议与路径，如 www.kuriyona.com）：${value}` } as const;
    } else if (
      type === 'prefix' &&
      (!HOSTNAME.test(value.split('/')[0] ?? '') || !value.includes('/'))
    ) {
      return {
        error: `前缀需为「主机名 + 路径」，不带协议 / 查询串 / 锚点（如 www.kuriyona.com/img/）：${value}`,
      } as const;
    } else if (type === 'tag' && /\s/.test(value)) {
      return { error: `标签不能含空白字符：${value}` } as const;
    }
  }
  return { values } as const;
};

/** 列出 token 能看到的 zone（管理页域名下拉）；最多翻 5 页（250 个） */
export const listZones: H = async (c) => {
  const token = c.env.CF_API_TOKEN;
  if (!token) return missingToken(c);

  const zones: { id: string; name: string; status?: string; plan?: string }[] = [];
  try {
    for (let page = 1; page <= 5; page++) {
      const res = (await cfFetch(
        token,
        `/zones?per_page=50&order=name&page=${page}`,
      )) as CfEnvelope<{ id: string; name: string; status?: string; plan?: { name?: string } }[]>;
      if (!res.success) {
        return c.json({ message: cfErrors(res.errors, 'Cloudflare 查询域名列表失败') }, 502);
      }
      for (const zone of res.result ?? []) {
        zones.push({ id: zone.id, name: zone.name, status: zone.status, plan: zone.plan?.name });
      }
      if ((res.result_info?.total_pages ?? 1) <= page) break;
    }
  } catch {
    return c.json({ message: 'Cloudflare 请求失败（网络或超时）' }, 502);
  }
  return c.json({ zones });
};

/** 清除缓存：`{ zone, type, targets[] }` → `POST /zones/{id}/purge_cache` */
export const purgeCache: H = async (c) => {
  const token = c.env.CF_API_TOKEN;
  if (!token) return missingToken(c);

  let body: { zone?: unknown; type?: unknown; targets?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ message: 'Invalid body' }, 400);
  }

  const zone = typeof body.zone === 'string' ? body.zone.trim() : '';
  if (!zone) return c.json({ message: '缺少 zone（zone id 或域名）' }, 400);
  const type = body.type as PurgeType;
  if (typeof body.type !== 'string' || !Object.hasOwn(PURGE_FIELD, type)) {
    return c.json({ message: `type 只接受 ${Object.keys(PURGE_FIELD).join(' / ')}` }, 400);
  }
  const parsed = parseTargets(body.targets, type);
  if ('error' in parsed) return c.json({ message: parsed.error }, 400);

  try {
    const resolved = await resolveZoneId(token, zone);
    if ('error' in resolved) return c.json({ message: resolved.error }, 502);
    if (!resolved.id) {
      return c.json(
        { message: `未找到 ${zone} 对应的 zone（token 需要有该域名的 Zone:Read）` },
        400,
      );
    }

    const res = await cfFetch(token, `/zones/${resolved.id}/purge_cache`, {
      method: 'POST',
      body: JSON.stringify({ [PURGE_FIELD[type]]: parsed.values }),
    });
    if (!res.success) {
      return c.json(
        { message: cfErrors(res.errors, 'Cloudflare 拒绝该清除请求'), errors: res.errors },
        502,
      );
    }
    // 200 只代表 Cloudflare 收下了请求：是否真的清掉要看下一次请求的 CF-Cache-Status 是否 MISS
    return c.json({ success: true, zone: resolved.id, type, purged: parsed.values.length });
  } catch {
    return c.json({ message: 'Cloudflare 请求失败（网络或超时）' }, 502);
  }
};
