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

const parseListObjects = (xml: string) => {
  const out: { key: string; size: number; lastModified: string; eTag: string }[] = [];
  for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
    const body = m[1] ?? '';
    const pick = (tag: string) =>
      body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? '';
    out.push({
      key: decodeXml(pick('Key')),
      size: Number(pick('Size') || 0),
      lastModified: pick('LastModified'),
      eTag: decodeXml(pick('ETag')).replace(/^"|"$/g, ''),
    });
  }
  return out;
};

export const listR2: H = async (c) => {
  const res = await getR2(c.env).fetch(`${r2ObjectUrl(c.env, '')}?list-type=2&prefix=static`);
  if (!res.ok) {
    return c.json({ message: 'R2 list failed' }, 502);
  }
  return c.json(parseListObjects(await res.text()));
};

export const signedUrl: H = async (c) => {
  const key = c.req.query('key') ?? '';
  const mime = c.req.query('mime') ?? '';
  const url = await presignR2Put(c.env, `static/${key}`, mime || undefined);
  return c.json({ url, key });
};
