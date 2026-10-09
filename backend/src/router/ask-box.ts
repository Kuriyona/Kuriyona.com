import { eq } from 'drizzle-orm';
import type { Handler } from 'hono';
import { askBoxTable } from '../db/schema';
import type { Env } from '../env';
import { getDb } from '../utils';

type H = Handler<{ Bindings: Env }>;

export const createAsk: H = async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid body' }, 400);
  }
  if (
    !body ||
    typeof body !== 'object' ||
    typeof body.name !== 'string' ||
    typeof body.question !== 'string' ||
    typeof body.note !== 'string' ||
    typeof body.showName !== 'boolean' ||
    typeof body.showIP !== 'boolean'
  ) {
    return c.json({ message: 'Invalid body' }, 400);
  }
  const q: typeof askBoxTable.$inferInsert = {
    name: body.name.length > 0 ? body.name : undefined,
    showName: Number(body.showName),
    ua: c.req.header('user-agent') || undefined,
    showIP: Number(body.showIP),
    question: body.question,
    note: body.note.length > 0 ? body.note : undefined,
    public: 0,
    askedAt: Date.now(),
  };
  await getDb(c.env).insert(askBoxTable).values(q);
  return c.json({ message: 'Success' });
};

export const listPublicAsks: H = async (c) => {
  const res = await getDb(c.env)
    .select({
      name: askBoxTable.name,
      showName: askBoxTable.showName,
      showIP: askBoxTable.showIP,
      ua: askBoxTable.ua,
      question: askBoxTable.question,
      answer: askBoxTable.answer,
      askedAt: askBoxTable.askedAt,
      answeredAt: askBoxTable.answeredAt,
    })
    .from(askBoxTable)
    .where(eq(askBoxTable.public, 1));
  return c.json(
    res.map((item) => ({
      ...item,
      question: item.question || '',
      answer: item.answer || '',
      askedAt: item.askedAt,
      answeredAt: item.answeredAt !== 0 ? item.answeredAt : undefined,
    })),
  );
};

export const listAllAsks: H = async (c) => {
  const res = await getDb(c.env).select().from(askBoxTable);
  return c.json(res);
};

export const deleteAsk: H = async (c) => {
  await getDb(c.env)
    .delete(askBoxTable)
    .where(eq(askBoxTable.id, c.req.param('id')));
  return c.json({ message: 'Success' });
};

export const setAskPublic: H = async (c) => {
  await getDb(c.env)
    .update(askBoxTable)
    .set({ public: Number(c.req.param('isPublic')) })
    .where(eq(askBoxTable.id, c.req.param('id')));
  return c.json({ message: 'Success' });
};

export const answerAsk: H = async (c) => {
  await getDb(c.env)
    .update(askBoxTable)
    .set({ answer: c.req.param('answer'), answeredAt: Date.now() })
    .where(eq(askBoxTable.id, c.req.param('id')));
  return c.json({ message: 'Success' });
};
