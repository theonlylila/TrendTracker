import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * The whole dashboard lives as one JSON document per row.
 * This is a personal, single-user app, so there's always exactly one row
 * (id = "main"). Adding a new feature later (e.g. a wardrobe tab) means
 * adding a new key to the JSON shape in `src/lib/types.ts` — no migration,
 * no new table, no schema change here.
 *
 * Tradeoff, on purpose: this makes ad-hoc SQL queries/reports over the data
 * harder (everything's inside one jsonb blob). Fine for "my own dashboard,
 * rendered by my own app." Would need real tables if this ever needed
 * cross-user analytics or complex querying.
 */
export const dashboards = pgTable("dashboards", {
  id: text("id").primaryKey().default("main"),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type DashboardRow = typeof dashboards.$inferSelect;
