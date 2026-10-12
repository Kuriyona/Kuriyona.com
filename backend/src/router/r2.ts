import type { Handler } from 'hono';
import type { Env } from '../env';
import { getR2, presignR2Put, r2ObjectUrl } from '../utils';

type H = Handler<{ Bindings: Env }>;

const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const pickTag = (body: string, tag: string) =>
  body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? '';

const parseListObjects = (xml: string) => {
  const out: { key: string; size: number; lastModified: string; eTag: string }[] = [];
  for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
    const body = m[1] ?? '';
    out.push({
      key: decodeXml(pickTag(body, 'Key')),
      size: Number(pickTag(body, 'Size') || 0),
      lastModified: pickTag(body, 'LastModified'),
      eTag: decodeXml(pickTag(body, 'ETag')).replace(/^"|"$/g, ''),
    });
  }
  return out;
};

// 虚拟目录：ListObjectsV2 在带 delimiter 时把同层键折叠成 CommonPrefixes
const parseCommonPrefixes = (xml: string) =>
  [...xml.matchAll(/<CommonPrefixes>([\s\S]*?)<\/CommonPrefixes>/g)].map((m) =>
    decodeXml(pickTag(m[1] ?? '', 'Prefix')),
  );

const R2_ROOT = 'static/';

export const listR2: H = async (c) => {
  const prefix = (c.req.query('prefix') ?? '').replace(/^\/+/, '').replace(/^static\//, '');
  const delimiter = c.req.query('delimiter') ?? '/';
  const params = new URLSearchParams({
    'list-type': '2',
    'max-keys': '1000',
    prefix: `${R2_ROOT}${prefix}`,
  });
  if (delimiter) params.set('delimiter', delimiter);
  const res = await getR2(c.env).fetch(`${r2ObjectUrl(c.env, '')}?${params}`);
  if (!res.ok) {
    return c.json({ message: 'R2 list failed' }, 502);
  }
  const xml = await res.text();
  return c.json({
    prefix,
    folders: parseCommonPrefixes(xml).map((p) => p.slice(R2_ROOT.length)),
    files: parseListObjects(xml).map((item) => ({
      ...item,
      name: item.key.slice(item.key.lastIndexOf('/') + 1),
    })),
    truncated: pickTag(xml, 'IsTruncated') === 'true',
  });
};

export const signedUrl: H = async (c) => {
  const key = c.req.query('key') ?? '';
  const mime = c.req.query('mime') ?? '';
  const url = await presignR2Put(c.env, `static/${key}`, mime || undefined);
  return c.json({ url, key });
};
