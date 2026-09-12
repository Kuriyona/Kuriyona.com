import Elysia, { t } from "elysia";
import { validateAuth } from "../plugin/auth";

// ── Weather ──
const weatherHost = "https://nb2mt9vk5n.re.qweatherapi.com";
const weatherKey = process.env.WEATHER_API_KEY!;

export let weatherData: any = {};
let weatherLastUpdate = -1;

export const updateWeather = async () => {
  if (Date.now() - weatherLastUpdate < 1800_000) return;
  weatherLastUpdate = Date.now();
  const res = await fetch(`${weatherHost}/v7/weather/now?location=101210107`, {
    headers: { "X-QW-Api-Key": weatherKey },
  });
  weatherData = await res.json();
};

// ── GitHub Activity ──
const githubUsername = "Kuriyona";

export let githubData: Record<string, string> = {};
let githubLastUpdate = -1;

export const updateGitHubActivity = async () => {
  if (Date.now() - githubLastUpdate < 60_000) return;
  githubLastUpdate = Date.now();

  const token = process.env.GITHUB_API_TOKEN;
  if (!token) return;

  try {
    const res = await fetch(`https://api.github.com/users/${githubUsername}/events?per_page=100`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "kuriyona-api" },
    });
    if (!res.ok) return;
    const events: any[] = await res.json();

    const pushEvents: { repo: string; time: string }[] = [];
    for (const event of events) {
      if (event.type !== "PushEvent") continue;
      pushEvents.push({
        repo: event.repo.name,
        time: event.created_at,
      });
    }

    const repoSet = new Set(pushEvents.map((e) => e.repo));
    const repos = Array.from(repoSet);
    const timeMap = new Map<string, string>();
    repos.forEach((repo) => {
      timeMap.set(repo, pushEvents.find((e) => e.repo === repo)?.time ?? "");
    });
    githubData = Object.fromEntries(timeMap);
  } catch {
    // silently fail
  }
};

// ── Steam ──
const steamId = "76561199158556744";

export interface SteamInfo {
  personaName: string;
  personaState: number;
  realName: string;
  gameExtraInfo: string;
  gameId: string;
}

export let steamData: SteamInfo | null = null;
let steamLastUpdate = -1;

export const updateSteam = async () => {
  if (Date.now() - steamLastUpdate < 60_000) return;
  steamLastUpdate = Date.now();

  const apiKey = process.env.STEAM_API_KEY;
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
      personaName: player.personaname ?? "",
      personaState: player.personastate ?? 0,
      realName: player.realname ?? "",
      gameExtraInfo: player.gameextrainfo ?? "",
      gameId: player.gameid ?? "",
    };
  } catch {
    // silently fail
  }
};

// ── Dynamic Data Map (via authenticated POST/DELETE) ──
const dataMap: Record<string, any> = {};

// ── Routes ──
const app = new Elysia({ prefix: "/status" })
  .get("/", async ({ set }) => {
    await Promise.all([updateWeather(), updateGitHubActivity(), updateSteam()]);
    set.headers["cache-control"] = "public, max-age=1800";
    return {
      weather: weatherData,
      github_activity: githubData,
      steam: steamData,
      ...dataMap,
    };
  })
  .use(
    new Elysia()
      .use(validateAuth)
      .post(
        "/",
        async ({ body }) => {
          const b = body as Record<string, any>;
          for (const key of Object.keys(b)) {
            dataMap[key] = b[key];
          }
          return { message: "ok" };
        },
        { body: t.Record(t.String(), t.Any()) },
      )
      .delete(
        "/",
        async ({ query: { key } }) => {
          if (key) {
            const keys = key.split(",");
            for (const k of keys) {
              delete dataMap[k.trim()];
            }
          } else {
            for (const k of Object.keys(dataMap)) {
              delete dataMap[k];
            }
          }
          return { message: "ok" };
        },
        { query: t.Object({ key: t.Optional(t.String()) }) },
      ),
  );

export { app as RouteStatus };
