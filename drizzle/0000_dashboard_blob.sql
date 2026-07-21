CREATE TABLE IF NOT EXISTS "dashboards" (
  "id" text PRIMARY KEY DEFAULT 'main',
  "data" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Seed the single row this app expects. Safe to run more than once.
INSERT INTO "dashboards" ("id", "data")
VALUES ('main', '{"tasks": [], "gymSessions": [], "weeklyFocuses": [], "reflections": [], "currentlyReading": []}'::jsonb)
ON CONFLICT ("id") DO NOTHING;
