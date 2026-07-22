"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";
import { useDashboardStore } from "@/hooks/useDashboardStore";
import { addWeeks, formatWeekLabel, getMondayOfWeek, getWeekKey } from "@/lib/week";
import { TaskChecklist } from "./TaskChecklist";
import { WorkoutTracker } from "./workout/WorkoutTracker";
import { StretchTracker } from "./stretch/StretchTracker";
import { StepsTracker } from "./steps/StepsTracker";
import { WeeklyFocusCard } from "./WeeklyFocusCard";
import { MealTracker } from "./meals/MealTracker";
import { ReflectionsCard } from "./ReflectionsCard";
import { CurrentlyReadingCard } from "./CurrentlyReadingCard";

const statusLabel: Record<string, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save — check your connection",
};

export function WeekView({ initialData }: { initialData: DashboardData }) {
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const { data, update, status, flush } = useDashboardStore(initialData);
  const weekKey = getWeekKey(weekStart);
  const isCurrentWeek = getWeekKey(new Date()) === weekKey;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart((d) => addWeeks(d, -1))}
            aria-label="Previous week"
            className="nav-btn"
          >
            ←
          </button>
          <div className="text-center min-w-[160px]">
            <p className="font-display text-lg">{formatWeekLabel(weekStart)}</p>
            {!isCurrentWeek && (
              <button
                onClick={() => setWeekStart(getMondayOfWeek(new Date()))}
                className="font-mono text-[11px] text-clay hover:underline"
              >
                back to this week
              </button>
            )}
          </div>
          <button
            onClick={() => setWeekStart((d) => addWeeks(d, 1))}
            aria-label="Next week"
            className="nav-btn"
          >
            →
          </button>
        </div>

        <div className="flex items-center gap-3">
          <p
            className={`font-mono text-[11px] transition-opacity ${
              status === "idle" ? "opacity-0" : "opacity-100"
            } ${status === "error" ? "text-clay" : "text-muted"}`}
          >
            {statusLabel[status]}
          </p>

          {/* Plain <a>, not next/link's <Link> — clicking this still does a
              full page reload (via window.location.href below), so this page
              and the training page never show each other stale, cached data.
              The onClick intercepts the click first, though: it waits for any
              edit that hasn't reached the database yet to actually finish
              saving (`await flush()`) before letting the navigation happen.
              Without this, clicking here right after logging something could
              tear down the page mid-save — the pending save is just a
              scheduled `setTimeout` in memory, and closing/leaving the page
              cancels it before it ever runs, silently losing that edit. */}
          <a
            href="/training"
            onClick={async (e) => {
              e.preventDefault();
              const saved = await flush();
              // Only navigate if the save actually succeeded (or there was
              // nothing to save). If it failed (e.g. no internet right at
              // that moment), stay put — the status text above will already
              // say "Couldn't save — check your connection", so the user
              // knows why and can retry, rather than being whisked away from
              // an edit that never made it to the database.
              if (saved) {
                window.location.href = "/training";
              }
            }}
            className="font-mono text-[11px] text-clay hover:underline"
          >
            Training trends →
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <TaskChecklist weekKey={weekKey} data={data} update={update} />
        <WorkoutTracker weekKey={weekKey} weekStart={weekStart} data={data} update={update} />
        <StretchTracker weekKey={weekKey} weekStart={weekStart} data={data} update={update} />
        <StepsTracker weekKey={weekKey} weekStart={weekStart} data={data} update={update} />
        <WeeklyFocusCard weekKey={weekKey} data={data} update={update} />
        <CurrentlyReadingCard weekKey={weekKey} data={data} update={update} />
        <div className="md:col-span-2">
          <MealTracker weekKey={weekKey} weekStart={weekStart} data={data} update={update} />
        </div>
        <div className="md:col-span-2">
          <ReflectionsCard weekKey={weekKey} data={data} update={update} />
        </div>
      </div>
    </div>
  );
}
