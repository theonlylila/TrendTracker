"use client";

import type { DashboardData } from "@/lib/types";
import { ConsistencyCalendar } from "./ConsistencyCalendar";
import { ExerciseProgressChart } from "./ExerciseProgressChart";
import { StretchConsistencyCalendar } from "./StretchConsistencyCalendar";
import { StepsConsistencyCalendar } from "./StepsConsistencyCalendar";

export function TrainingTrends({ data }: { data: DashboardData }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="eyebrow">Movement trends</p>
          <h1 className="font-display text-2xl mt-1 text-ink">How it&apos;s going</h1>
        </div>
        {/* Plain <a>, not next/link's <Link> — see the note in src/app/page.tsx for why. */}
        <a href="/" className="font-mono text-[11px] text-clay hover:underline">
          ← Your Week
        </a>
      </div>

      <div className="space-y-5">
        <div className="card overflow-x-auto">
          <p className="eyebrow mb-3">Training consistency, last 12 weeks</p>
          <ConsistencyCalendar data={data} />
        </div>

        <div className="card">
          <p className="eyebrow mb-3">Exercise progress</p>
          <ExerciseProgressChart data={data} />
        </div>

        <div className="card overflow-x-auto">
          <p className="eyebrow mb-3">Stretch consistency, last 12 weeks</p>
          <StretchConsistencyCalendar data={data} />
        </div>

        <div className="card overflow-x-auto">
          <p className="eyebrow mb-3">Steps goal, last 12 weeks</p>
          <StepsConsistencyCalendar data={data} />
        </div>
      </div>
    </div>
  );
}
