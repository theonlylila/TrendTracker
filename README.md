# Your Week — a personal life dashboard

Next.js 14 (App Router) + Drizzle ORM + Neon Postgres, restructured around a
single flexible JSON document instead of one table per feature. Right now it
has one view — **Week View** — with a task checklist (confetti + a little
pop sound on completion), a gym session tracker, a weekly focus with
supporting goals, a reflections box, and a currently-reading widget. This is
meant to be the first of several views (Habits, Quarter, Year, Wardrobe,
etc.) added one at a time.

## 1. Local setup

```bash
npm install
cp .env.example .env.local
```

Add your Neon **pooled** connection string to `.env.local` as
`DATABASE_URL` (console.neon.tech).

Create the table:

```bash
# Option A
npm run db:push

# Option B — paste this into the Neon SQL editor
# file: drizzle/0000_dashboard_blob.sql
```

Run it:

```bash
npm run dev
```

## 2. Deploy to Vercel

Same as before — push to GitHub, import into Vercel, connect a Neon
database (Storage tab → Create Database → Neon, or paste your own
`DATABASE_URL` into env vars), run the migration once, deploy.

## 3. How the data model works

Everything lives in one Postgres row:

```
dashboards
  id: "main"
  data: jsonb   <- the whole dashboard
  updated_at
```

`src/lib/types.ts` is the single source of truth for what's inside `data`.
Right now it has five arrays: `tasks`, `gymSessions`, `weeklyFocuses`,
`reflections`, `currentlyReading`. Everything is tagged with a `weekKey`
(like `"2026-W29"`) so each widget just filters the array down to the
current week.

**To add a new feature (say, a wardrobe log):**
1. Add a type and an array to `DashboardData` in `src/lib/types.ts`, and to
   `emptyDashboardData`.
2. Build a component that reads `data.wardrobe` and calls `update(prev => ...)`
   to change it — see `src/components/TaskChecklist.tsx` for the pattern.
3. No migration, no new table, no API route. The load/save actions in
   `src/app/actions.ts` already round-trip the whole blob.

This trades away easy SQL querying/reporting over your data (it's all
inside one jsonb column) for never having to touch the database when adding
a feature. Worth knowing, not worth worrying about for a personal app.

## 4. Auto-save

`src/hooks/useDashboardStore.ts` holds the dashboard in React state and
debounces saves by 800ms after the last change, so typing in a text field
doesn't hit the database on every keystroke. The header shows "Saving…" /
"Saved" so you always know the state of the world.

## 5. What's next

Natural next views, in roughly the order the original build did them:
- **Habit Tracker** — a weekly grid, daily vs. devotional sections, custom
  icons/colors/goals per habit.
- **Quarter View** — finances (credit cards, savings), quarterly goals by
  category, a gym-consistency chart across the last 13 weeks.
- **Year View** — four reflection prompts, yearly goals, themed "buckets."
- **Book tracking** — swap the manual currently-reading entry for a search
  against the free Open Library API, with cover art.
- **Bucket list / wishlists** — category-tagged, filterable, with a
  progress bar.

Two more involved integrations from the original build, intentionally
skipped for now since they need your own credentials:
- **Google Calendar sync** — needs a project in Google Cloud Console and an
  OAuth consent flow.
- **Daily morning text briefing** — either Claude Cowork + iMessage (Mac/iPhone,
  no third-party accounts) or Twilio (works anywhere, costs a few cents a
  message, needs phone number verification).

Ask me to build any of these next and I'll pick up from here.

## 6. Project structure

```
src/
  app/
    page.tsx        # server component: loads the blob, renders WeekView
    actions.ts        # loadDashboardData / saveDashboardData
    layout.tsx
    globals.css
  components/
    WeekView.tsx       # week nav + save status + composes the widgets below
    TaskChecklist.tsx
    GymTracker.tsx
    WeeklyFocusCard.tsx
    ReflectionsCard.tsx
    CurrentlyReadingCard.tsx
  hooks/
    useDashboardStore.ts  # client state + debounced auto-save
  lib/
    types.ts            # DashboardData shape — extend this to add features
    week.ts               # week-key / navigation helpers
    confetti.ts             # canvas confetti burst, no dependency
    sound.ts                  # Web Audio pop sound, no audio file
  db/
    schema.ts              # one table: dashboards(id, data jsonb, updated_at)
    index.ts
drizzle/0000_dashboard_blob.sql
```
