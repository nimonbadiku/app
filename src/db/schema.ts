import { pgTable, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  doors: integer("doors").notNull().default(0),
  yesCount: integer("yes_count").notNull().default(0),
  noCount: integer("no_count").notNull().default(0),
  notHomeCount: integer("not_home_count").notNull().default(0),
  itemsSold: integer("items_sold").notNull().default(0),
  earnings: numeric("earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("kr"),
  earningsPerItem: numeric("earnings_per_item", { precision: 10, scale: 2 }).notNull().default("20"),
  note: text("note"),
  experiment: text("experiment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: text("id").primaryKey(),
  earningsPerItem: numeric("earnings_per_item", { precision: 10, scale: 2 }).notNull().default("20"),
  pricePerItem: numeric("price_per_item", { precision: 10, scale: 2 }).notNull().default("50"),
  currency: text("currency").notNull().default("kr"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
