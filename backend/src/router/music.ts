import type { Handler } from 'hono';
import { getLyric, getPlaylistTracks } from '@kuriyona/cecilia';
import type { Env } from '../env';

type H = Handler<{ Bindings: Env }>;

// 播放器固定取这个歌单（「JW」）；换歌单只改这里
const PLAYLIST_ID = 18488781852;
const PLAYLIST_CACHE_KEY = `cache:music:playlist:${PLAYLIST_ID}`;
// 歌单变动少：上游结果缓存 6 小时（改完歌单最多 6 小时后生效）；浏览器再缓存 1 小时
const PLAYLIST_CACHE_TTL = 60 * 60 * 6;
const PLAYLIST_MAX_AGE = 60 * 60;

// 封面只当 48px 缩略图用，交给上游裁剪（实测 375 KB → 3.4 KB）
const COVER_PARAM = 'param=96y96';

interface MusicTrack {
  id: number;
  name: string;
  artists: string[];
  coverUrl: string;
  duration: number;
}

// 网易 CDN 给的是 http:// 直链，站点是 https：不升级协议会被浏览器当混合内容拦掉
const toHttps = (url: string) => url.replace(/^http:\/\//, 'https://');
const coverThumb = (url: string) => (url ? `${toHttps(url)}?${COVER_PARAM}` : '');

/** 歌单曲目：KV 命中直接返回原文，未命中查上游后写 KV */
export const getMusicPlaylist: H = async (c) => {
  const headers = {
    'content-type': 'application/json;charset=UTF-8',
    'cache-control': `public, max-age=${PLAYLIST_MAX_AGE}`,
  } as const;

  const cached = await c.env.STATUS_KV.get(PLAYLIST_CACHE_KEY);
  if (cached) return c.body(cached, 200, headers);

  let tracks: MusicTrack[];
  try {
    const songs = await getPlaylistTracks({ id: PLAYLIST_ID });
    tracks = songs.map((song) => ({
      id: song.id,
      name: song.name,
      artists: song.artists.map((artist) => artist.name),
      coverUrl: coverThumb(song.album.coverUrl),
      duration: song.duration,
    }));
  } catch (error) {
    return c.json(
      { message: `[netease] ${error instanceof Error ? error.message : String(error)}` },
      502,
    );
  }

  const body = JSON.stringify({ tracks });
  await c.env.STATUS_KV.put(PLAYLIST_CACHE_KEY, body, { expirationTtl: PLAYLIST_CACHE_TTL });
  return c.body(body, 200, headers);
};

// 歌词跟着曲目 id 走、内容基本不变：KV 永久缓存（put 不设 expirationTtl），浏览器侧一年 + immutable。
// 上游改了歌词不会自动更新，要换只能手动删 KV 键 cache:music:lyric:<id>（或等浏览器缓存过期）。
const LYRIC_CACHE_PREFIX = 'cache:music:lyric:';
const LYRIC_MAX_AGE = 60 * 60 * 24 * 365;

interface MusicLyricLine {
  /** 该行开始时间，毫秒（cecilia 给的是秒） */
  time: number;
  text: string;
  translation?: string;
}

/** 歌词（含逐行翻译）：KV 命中直接返回原文，未命中查上游后写 KV；无歌词也算结果，缓存空数组避免反复打上游 */
export const getMusicLyric: H = async (c) => {
  const id = Number(c.req.query('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: '[request] 缺少合法的 id' }, 400);
  }

  const headers = {
    'content-type': 'application/json;charset=UTF-8',
    'cache-control': `public, max-age=${LYRIC_MAX_AGE}, immutable`,
  } as const;

  const cacheKey = `${LYRIC_CACHE_PREFIX}${id}`;
  const cached = await c.env.STATUS_KV.get(cacheKey);
  if (cached) return c.body(cached, 200, headers);

  let lines: MusicLyricLine[];
  try {
    const lyric = await getLyric(id);
    // 上游把原文与翻译按时间合并：翻译行缺原文时会沿用上一行文本，于是出现连续重复，去掉
    lines = [];
    for (const line of lyric.lines) {
      const text = line.text.trim();
      if (!text && !line.translation) continue;
      const previous = lines[lines.length - 1];
      if (previous && previous.text === text && previous.translation === line.translation) continue;
      lines.push({
        time: Math.round(line.time * 1000),
        text,
        ...(line.translation ? { translation: line.translation } : {}),
      });
    }
  } catch (error) {
    return c.json(
      { message: `[netease] ${error instanceof Error ? error.message : String(error)}` },
      502,
    );
  }

  const body = JSON.stringify({ lines });
  await c.env.STATUS_KV.put(cacheKey, body);
  return c.body(body, 200, headers);
};

const PURGE_TARGETS = ['playlist', 'lyric'] as const;
type PurgeTarget = (typeof PURGE_TARGETS)[number];

const isPurgeTarget = (value: unknown): value is PurgeTarget =>
  typeof value === 'string' && (PURGE_TARGETS as readonly string[]).includes(value);

/** KV 不给批量删：list 分页（上限 1000/页）后逐个 delete */
const deleteByPrefix = async (kv: KVNamespace, prefix: string) => {
  let cursor: string | undefined;
  let deleted = 0;
  do {
    const page = await kv.list({ prefix, cursor });
    for (const key of page.keys) {
      await kv.delete(key.name);
      deleted += 1;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return deleted;
};

/**
 * 管理端立即刷新音乐缓存（body `{ target: 'playlist' | 'lyric' }`）：
 * playlist = 删歌单 KV（下次 GET /music/playlist 重新问上游）；
 * lyric = 删全部 `cache:music:lyric:*`（下次播放该曲目再取上游）。
 * 只清 Worker 侧 KV；浏览器/边缘上的旧响应要另外走 /cache/purge（歌词响应带 immutable）。
 */
export const purgeMusicCache: H = async (c) => {
  const body = await c.req.json<{ target?: unknown }>().catch(() => null);
  const target = body?.target;
  if (!isPurgeTarget(target)) {
    return c.json({ message: `[request] target 必须是 ${PURGE_TARGETS.join(' / ')}` }, 400);
  }

  let deleted: number;
  if (target === 'playlist') {
    await c.env.STATUS_KV.delete(PLAYLIST_CACHE_KEY);
    deleted = 1;
  } else {
    deleted = await deleteByPrefix(c.env.STATUS_KV, LYRIC_CACHE_PREFIX);
  }

  return c.json({ success: true, target, deleted });
};
