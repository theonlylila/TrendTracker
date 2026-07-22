import { loadDashboardData } from "@/app/actions";
import { WeekView } from "@/components/WeekView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await loadDashboardData();

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-5 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="font-display text-3xl mt-1 text-ink">Your Week</h1>
          </div>
          {/* The "Training trends →" link used to live here as a plain <a>.
              It now lives inside WeekView (a client component) instead,
              because navigating there needs to wait for any pending save to
              finish first — something only WeekView (which owns the save
              logic via useDashboardStore) can do. See useDashboardStore.ts's
              `flush` for why. */}
        </header>

        <WeekView initialData={data} />

        <footer className="mt-10 pt-6 border-t border-line">
          <p className="font-mono text-[11px] text-muted">
            a little dashboard, made for one
          </p>
        </footer>
      </div>
    </main>
  );
}
