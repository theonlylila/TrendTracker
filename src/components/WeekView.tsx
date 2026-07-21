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
  const { data, update, status } = useDashboardStore(initialData);
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

        <p
          className={`font-mono text-[11px] transition-opacity ${
            status === "idle" ? "opacity-0" : "opacity-100"
          } ${status === "error" ? "text-clay" : "text-muted"}`}
        >
          {statusLabel[status]}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <TaskChecklist weekKey={weekKey} data={data} update={update} />
        <WorkoutTracker weekKey={weekKey} weekStart={weekStart} data={data} update={update} />
        <StretchTracker weekKey={weekKey} weekStart={weekStart} data={data} update={update} />
        <StepsTracker weekKey={weekKey} weekStart={weekStart} data={data} update={update} />
        <WeeklyFocusCard weekKey={weekKey} data={data} update={update} />
        <CurrentlyReadingCard weekKey={weekKey} data={data} update={update} />
        <div className="md:col-span-2">
          <ReflectionsCard weekKey={weekKey} data={data} update={update} />
        </div>
      </div>
    </div>
  );
}
