import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const askBoxTable = sqliteTable('ask_table', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  showName: integer('show_name').notNull(),
  showIP: integer('show_ip').notNull().default(0),
  ua: text('ua'),
  question: text('question'),
  answer: text('answer'),
  note: text('note'),
  public: integer('public').notNull().default(0),
  askedAt: integer('asked_at'),
  answeredAt: integer('answered_at'),
});

export const statusDataTable = sqliteTable('status_data', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
