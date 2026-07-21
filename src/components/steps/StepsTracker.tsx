"use client";

import type { DashboardData } from "@/lib/types";
import { getWeekDays, toDateKey } from "@/lib/week";

type Props = {
  weekKey: string;
  weekStart: Date;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

export function StepsTracker({ weekKey, weekStart, data, update }: Props) {
  const days = getWeekDays(weekStart);

  function entryFor(dateKey: string) {
    return data.stepEntries.find((e) => e.date === dateKey) ?? null;
  }

  function setSteps(dateKey: string, value: string) {
    if (value === "") {
      update((prev) => ({
        ...prev,
        stepEntries: prev.stepEntries.filter((e) => e.date !== dateKey),
      }));
      return;
    }

    const steps = Math.max(0, Math.floor(Number(value)));
    if (Number.isNaN(steps)) return;

    update((prev) => {
      const existing = prev.stepEntries.find((e) => e.date === dateKey);
      if (existing) {
        return {
          ...prev,
          stepEntries: prev.stepEntries.map((e) => (e.date === dateKey ? { ...e, steps } : e)),
        };
      }
      return {
        ...prev,
        stepEntries: [
          ...prev.stepEntries,
          { id: crypto.randomUUID(), weekKey, date: dateKey, steps },
        ],
      };
    });
  }

  function setGoal(value: string) {
    if (value === "") return;
    const goal = Math.max(0, Math.floor(Number(value)));
    if (Number.isNaN(goal)) return;
    update((prev) => ({ ...prev, stepsGoal: goal }));
  }

  const metCount = days.filter((day) => {
    const entry = entryFor(toDateKey(day));
    return !!entry && entry.steps >= data.stepsGoal;
  }).length;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Steps</p>
        <p className="font-mono text-xs text-muted">{metCount}/7 met goal</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="steps-goal" className="text-xs text-muted shrink-0">
          Daily goal
        </label>
        <input
          id="steps-goal"
          type="number"
          min={0}
          value={data.stepsGoal}
          onChange={(e) => setGoal(e.target.value)}
          className="field w-28 py-1 text-sm"
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const entry = entryFor(dateKey);
          const met = !!entry && entry.steps >= data.stepsGoal;

          return (
            <li key={dateKey} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-8 shrink-0">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>

              <input
                type="number"
                min={0}
                placeholder="0"
                value={entry?.steps ?? ""}
                onChange={(e) => setSteps(dateKey, e.target.value)}
                className="field flex-1 py-1 text-sm"
              />

              <span
                className={`font-mono text-[11px] shrink-0 w-14 text-right ${
                  met ? "text-sage-light" : "text-muted"
                }`}
              >
                {met ? "✓ met" : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
