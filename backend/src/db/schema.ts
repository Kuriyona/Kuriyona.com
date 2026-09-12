import { bigint, int, mysqlTable, text } from "drizzle-orm/mysql-core";

export const askBoxTable = mysqlTable("ask_table", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name"),
  showName: int("show_name").notNull(),
  showIP: int("show_ip").notNull().default(0),
  ua: text("ua"),
  question: text("question"),
  answer: text("answer"),
  note: text("note"),
  public: int("public").notNull().default(0),
  askedAt: bigint("asked_at", { mode: "number" }),
  answeredAt: bigint("answered_at", { mode: "number" }),
});