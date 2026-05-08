import Elysia, { t, sse } from 'elysia';

import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);

const SystemPrompt = await fs.readFile(path.join(dirname, './prompt.md'), 'utf-8');

const app = new Elysia({ prefix: '/neko' });

app.post(
  '/chat/stream',
  async function* ({ body }) {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
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
);

export { app as RouteNekoApi };
