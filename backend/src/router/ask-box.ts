import Elysia, { t } from "elysia";
import { askBoxTable } from "../db/schema";
import { db } from "../utils";
import { eq } from "drizzle-orm";
import { validateAuth, validateJWT } from "../plugin/auth";

const app = new Elysia({ prefix: "/ask-box" });

app.use(
  new Elysia().use(validateJWT).post(
    "/",
    async ({ body, headers }) => {
      const q: typeof askBoxTable.$inferInsert = {
        name: body.name.length > 0 ? body.name : undefined,
        showName: Number(body.showName),
        ua: headers["user-agent"] || undefined,
        showIP: Number(body.showIP),
        question: body.question,
        note: body.note.length > 0 ? body.note : undefined,
        public: 0,
        askedAt: Date.now(),
      };
      await db.insert(askBoxTable).values(q);
      return { message: "Success" };
    },
    {
      body: t.Object({
        name: t.String(),
        showName: t.Boolean(),
        showIP: t.Boolean(),
        question: t.String(),
        note: t.String(),
      }),
    },
  ),
);

app.get("/", async () => {
  const res = await db
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
  return res.map((item) => ({
    ...item,
    question: item.question || "",
    answer: item.answer || "",
    askedAt: item.askedAt,
    answeredAt: item.answeredAt !== 0 ? item.answeredAt : undefined,
  }));
});

app.use(
  new Elysia()
    .use(validateAuth)
    .get("/admin", async () => {
      const res = await db.select().from(askBoxTable);
      return res;
    })
    .delete("/admin/:id", async ({ params }) => {
      await db.delete(askBoxTable).where(eq(askBoxTable.id, Number(params.id)));
      return { message: "Success" };
    })
    .put("/admin/:id/public/:isPublic", async ({ params }) => {
      await db
        .update(askBoxTable)
        .set({ public: Number(params.isPublic) })
        .where(eq(askBoxTable.id, Number(params.id)));
      return { message: "Success" };
    })
    .put("/admin/:id/answer/:answer", async ({ params }) => {
      await db
        .update(askBoxTable)
        .set({ answer: params.answer, answeredAt: Date.now() })
        .where(eq(askBoxTable.id, Number(params.id)));
      return { message: "Success" };
    }),
);

export { app as RouteAskBox };
