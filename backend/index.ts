import { Elysia, t } from "elysia";
import { RouterR2 } from "./src/router/r2";
import { RouteStatus } from "./src/router/status";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysia/jwt";
import { verifyTurnstile, db } from "./src/utils";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { RouteAskBox } from "./src/router/ask-box";

await migrate(db, { migrationsFolder: import.meta.dir + "/drizzle" });

const app = new Elysia()
  .use(
    cors({
      origin: "*",
    }),
  )
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .get("/", () => "This API site of Kuriyona.com")
  .use(RouterR2)
  .use(RouteStatus)
  .use(RouteAskBox)
  .get(
    "/turnstile",
    async ({ jwt, query: { token } }) => {
      const result = await verifyTurnstile(token);
      if (result) {
        const value = await jwt.sign({
          pass: true,
          exp: "2h",
        });
        return value;
      }
      return null;
    },
    {
      query: t.Object({
        token: t.String(),
      }),
    },
  );

app.listen(process.env.PORT || 62802);
console.log(`Server is running on port ${process.env.PORT || 62802}`);
