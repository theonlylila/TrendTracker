import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add your Neon connection string to .env.local (see .env.example)."
  );
}

// `fetchOptions: { cache: "no-store" }` — this is the fix for a real bug we
// tracked down: the Neon "serverless" driver talks to the database over
// plain HTTP requests under the hood (that's what makes it work from
// Next.js's server environment at all). Next.js automatically intercepts
// every `fetch()` call made on the server and, by default, may cache its
// response and silently replay that same cached response for later calls
// that look identical — even though `export const dynamic = "force-dynamic"`
// on our pages is supposed to prevent exactly this. In practice, this meant
// a *stale, frozen-in-time snapshot* of the dashboard row got cached the
// first time this exact query ran, and every request after that kept
// re-serving that same old snapshot — so newly saved log entries were
// genuinely in the database (confirmed by querying it directly, bypassing
// Next.js entirely) but the app kept showing you old data anyway. Telling
// the underlying fetch call to never cache (`no-store`) forces every single
// database read to go fetch the real, current row — no exceptions.
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: "no-store" } });
export const db = drizzle(sql, { schema });
