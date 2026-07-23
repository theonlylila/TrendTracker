"use client";

import type { DashboardData } from "@/lib/types";
import { getWeekDays, toDateKey } from "@/lib/week";

type Props = {
  weekKey: string;
  weekStart: Date;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

// Deliberately built as a near copy of StepsTracker.tsx — same "daily goal +
// one number per day + met/not-met" shape, just for liters instead of
// steps. The one real difference: steps are always whole numbers, but water
// intake naturally comes in fractional amounts (e.g. 1.5L), so this parses
// with `Number(...)` instead of flooring to an integer, and the input uses
// `step="0.1"` so the browser's up/down arrows move in tenths of a liter
// instead of whole numbers.
export function WaterTracker({ weekKey, weekStart, data, update }: Props) {
  const days = getWeekDays(weekStart);

  function entryFor(dateKey: string) {
    return data.waterEntries.find((e) => e.date === dateKey) ?? null;
  }

  function setLiters(dateKey: string, value: string) {
    if (value === "") {
      update((prev) => ({
        ...prev,
        waterEntries: prev.waterEntries.filter((e) => e.date !== dateKey),
      }));
      return;
    }

    const liters = Math.max(0, Number(value));
    if (Number.isNaN(liters)) return;

    update((prev) => {
      const existing = prev.waterEntries.find((e) => e.date === dateKey);
      if (existing) {
        return {
          ...prev,
          waterEntries: prev.waterEntries.map((e) =>
            e.date === dateKey ? { ...e, liters } : e
          ),
        };
      }
      return {
        ...prev,
        waterEntries: [
          ...prev.waterEntries,
          { id: crypto.randomUUID(), weekKey, date: dateKey, liters },
        ],
      };
    });
  }

  function setGoal(value: string) {
    if (value === "") return;
    const goal = Math.max(0, Number(value));
    if (Number.isNaN(goal)) return;
    update((prev) => ({ ...prev, waterGoal: goal }));
  }

  const metCount = days.filter((day) => {
    const entry = entryFor(toDateKey(day));
    return !!entry && entry.liters >= data.waterGoal;
  }).length;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Water</p>
        <p className="font-mono text-xs text-muted">{metCount}/7 met goal</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="water-goal" className="text-xs text-muted shrink-0">
          Daily goal (L)
        </label>
        <input
          id="water-goal"
          type="number"
          min={0}
          step={0.1}
          value={data.waterGoal}
          onChange={(e) => setGoal(e.target.value)}
          className="field w-28 py-1 text-sm"
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const entry = entryFor(dateKey);
          const met = !!entry && entry.liters >= data.waterGoal;

          return (
            <li key={dateKey} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-8 shrink-0">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>

              <input
                type="number"
                min={0}
                step={0.1}
                placeholder="0"
                value={entry?.liters ?? ""}
                onChange={(e) => setLiters(dateKey, e.target.value)}
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
