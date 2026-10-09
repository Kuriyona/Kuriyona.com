import { inArray } from 'drizzle-orm';
import type { Handler } from 'hono';
import { statusDataTable } from '../db/schema';
import type { Env } from '../env';
import { getDb } from '../utils';

type H = Handler<{ Bindings: Env }>;

// ── Weather ──
const weatherHost = 'https://nb2mt9vk5n.re.qweatherapi.com';

let weatherData: any = {};
let weatherLastUpdate = -1;

const updateWeather = async (env: Env) => {
  if (Date.now() - weatherLastUpdate < 1800_000) return;
  weatherLastUpdate = Date.now();
  const res = await fetch(`${weatherHost}/v7/weather/now?location=101210107`, {
    headers: { 'X-QW-Api-Key': env.WEATHER_API_KEY! },
  });
  weatherData = await res.json();
};

// ── GitHub Activity ──
const githubUsername = 'Kuriyona';

let githubData: Record<string, string> = {};
let githubLastUpdate = -1;

const updateGitHubActivity = async (env: Env) => {
  if (Date.now() - githubLastUpdate < 60_000) return;
  githubLastUpdate = Date.now();

  const token = env.GITHUB_API_TOKEN;
  if (!token) return;

  try {
    const res = await fetch(`https://api.github.com/users/${githubUsername}/events?per_page=100`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'kuriyona-api' },
    });
    if (!res.ok) return;
    const events: any[] = await res.json();

    const pushEvents: { repo: string; time: string }[] = [];
    for (const event of events) {
      if (event.type !== 'PushEvent') continue;
      pushEvents.push({
        repo: event.repo.name,
        time: event.created_at,
      });
    }

    const repoSet = new Set(pushEvents.map((e) => e.repo));
    const repos = Array.from(repoSet);
    const timeMap = new Map<string, string>();
    repos.forEach((repo) => {
      timeMap.set(repo, pushEvents.find((e) => e.repo === repo)?.time ?? '');
    });
    githubData = Object.fromEntries(timeMap);
  } catch {
    // silently fail
  }
};

// ── Steam ──
const steamId = '76561199158556744';

export interface SteamInfo {
  personaName: string;
  personaState: number;
  realName: string;
  gameExtraInfo: string;
  gameId: string;
}

let steamData: SteamInfo | null = null;
let steamLastUpdate = -1;

const updateSteam = async (env: Env) => {
  if (Date.now() - steamLastUpdate < 60_000) return;
  steamLastUpdate = Date.now();

  const apiKey = env.STEAM_API_KEY;
  if (!apiKey) return;

  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`,
    );
    if (!res.ok) return;
    const body: any = await res.json();
    const player = body?.response?.players?.[0];
    if (!player) return;

    steamData = {
      personaName: player.personaname ?? '',
      personaState: player.personastate ?? 0,
      realName: player.realname ?? '',
      gameExtraInfo: player.gameextrainfo ?? '',
      gameId: player.gameid ?? '',
    };
  } catch {
    // silently fail
  }
};

// ── Routes ──
export const getStatus: H = async (c) => {
  await Promise.all([updateWeather(c.env), updateGitHubActivity(c.env), updateSteam(c.env)]);
  c.header('cache-control', 'public, max-age=1800');
  const rows = await getDb(c.env).select().from(statusDataTable);
  const dynamic: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      dynamic[row.key] = JSON.parse(row.value);
    } catch {
      dynamic[row.key] = row.value;
    }
  }
  return c.json({
    weather: weatherData,
    github_activity: githubData,
    steam: steamData,
    ...dynamic,
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
  const db = getDb(c.env);
  for (const [key, value] of Object.entries(body)) {
    const v = JSON.stringify(value);
    await db
      .insert(statusDataTable)
      .values({ key, value: v })
      .onConflictDoUpdate({ target: statusDataTable.key, set: { value: v } });
  }
  return c.json({ message: 'ok' });
};

export const deleteStatus: H = async (c) => {
  const key = c.req.query('key');
  const db = getDb(c.env);
  if (key) {
    const keys = key.split(',').map((k) => k.trim());
    await db.delete(statusDataTable).where(inArray(statusDataTable.key, keys));
  } else {
    await db.delete(statusDataTable);
  }
  return c.json({ message: 'ok' });
};
