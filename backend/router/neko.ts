import Elysia, { t, sse } from 'elysia';
import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);

import { updateWeather, data as WeatherData } from './weather';
import dayjs from 'dayjs';
import jwt from '@elysia/jwt';
import { validateAuth, validateJWT } from '../plugin/auth';

let SystemPromptRaw = await fs.readFile(path.join(dirname, '../prompt.md'), 'utf-8');
let SystemPrompt = '';
let lastChatTime = Date.now();

const updateSystemPrompt = async () => {
  await updateWeather();
  SystemPrompt = SystemPromptRaw.replace(
    '{{WEATHER}}',
    `${WeatherData.now.text} ${WeatherData.now.temp}℃`,
  ).replace('{{DATETIME}}', dayjs().format('YYYY-MM-DD HH 时 dddd'));
};
updateSystemPrompt();

const app = new Elysia({ prefix: '/neko' });

app.use(
  jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET!,
  }),
);

app.use(
  new Elysia().use(validateJWT).post(
    '/chat/stream',
    async function* ({ body, set }) {
      if (Date.now() - lastChatTime < 2 * 1000) {
        set.status = 429;
        yield sse({ event: 'error', data: '[当前的请求太多了喵]' });
        return;
      }
      lastChatTime = Date.now();
      const apiKey = process.env.LLM_API_KEY;
      if (!apiKey) {
        set.status = 500;
        yield sse({ event: 'error', data: 'LLM_API_KEY not configured' });
        return;
      }
      const model = 'Qwen/Qwen3-8B';
      const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: SystemPrompt }, ...body.messages],
          stream: true,
          enable_thinking: false,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        yield sse({ event: 'error', data: err.error?.message || 'API error' });
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                yield sse({ event: 'message', data: { content } });
              }
            } catch {}
          }
        }
      }
      yield sse({ event: 'done', data: '' });
    },
    {
      body: t.Object({
        messages: t.Array(
          t.Object({
            role: t.String(),
            content: t.String(),
          }),
        ),
      }),
    },
  ),
);

app.use(
  new Elysia()
    .use(validateAuth)
    .get('/admin/prompt', () => {
      return SystemPromptRaw;
    })
    .post(
      '/admin/prompt',
      async ({ body }) => {
        SystemPromptRaw = body;
        fs.writeFile(path.join(dirname, './prompt.md'), body);
        await updateSystemPrompt();
        return SystemPrompt;
      },
      {
        body: t.String(),
      },
    ),
);

export { app as RouteNekoApi };
