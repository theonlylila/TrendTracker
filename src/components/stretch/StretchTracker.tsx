"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";
import { getWeekDays, toDateKey } from "@/lib/week";
import { ManageStretchesModal } from "./ManageStretchesModal";
import { StretchLogModal } from "./StretchLogModal";

type Props = {
  weekKey: string;
  weekStart: Date;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

const DEFAULT_OPTION = "__default";
const NONE_OPTION = "__none";

export function StretchTracker({ weekKey, weekStart, data, update }: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  const [logDateKey, setLogDateKey] = useState<string | null>(null);

  const days = getWeekDays(weekStart);
  const hasSetup = data.stretches.length > 0 && data.stretchRoutines.length > 0;

  function routineFor(id: string | null) {
    return id ? data.stretchRoutines.find((r) => r.id === id) ?? null : null;
  }

  function effectiveRoutineId(dateKey: string, dayOfWeek: number): string | null {
    const override = data.stretchScheduleOverrides.find((o) => o.date === dateKey);
    if (override) return override.routineId;
    return (
      data.stretchDefaultSchedule.find((d) => d.dayOfWeek === dayOfWeek)?.routineId ?? null
    );
  }

  function setOverride(dateKey: string, value: string) {
    update((prev) => {
      const withoutExisting = prev.stretchScheduleOverrides.filter((o) => o.date !== dateKey);
      if (value === DEFAULT_OPTION) {
        return { ...prev, stretchScheduleOverrides: withoutExisting };
      }
      const routineId = value === NONE_OPTION ? null : value;
      return {
        ...prev,
        stretchScheduleOverrides: [
          ...withoutExisting,
          { id: crypto.randomUUID(), date: dateKey, routineId },
        ],
      };
    });
  }

  function isDayComplete(dateKey: string, routineId: string | null): boolean {
    const routine = routineFor(routineId);
    if (!routine || routine.stretchIds.length === 0) return false;
    const log = data.stretchLogs.find((l) => l.date === dateKey);
    if (!log) return false;
    return routine.stretchIds.every((id) => log.completedStretchIds.includes(id));
  }

  const completedCount = days.filter((day) => {
    const dateKey = toDateKey(day);
    const routineId = effectiveRoutineId(dateKey, day.getDay());
    return isDayComplete(dateKey, routineId);
  }).length;

  const logDay = logDateKey ? days.find((d) => toDateKey(d) === logDateKey) ?? null : null;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Stretches</p>
        <div className="flex items-center gap-3">
          <p className="font-mono text-xs text-muted">{completedCount}/7 done</p>
          <button
            onClick={() => setManageOpen(true)}
            className="font-mono text-[11px] text-clay hover:underline"
          >
            manage
          </button>
        </div>
      </div>

      {!hasSetup && (
        <div className="mt-3 flex items-center justify-between gap-3 bg-sand/60 border border-line rounded-lg px-3 py-2.5">
          <p className="text-sm text-muted">Add stretches and build a routine to get started.</p>
          <button onClick={() => setManageOpen(true)} className="btn-secondary shrink-0">
            Manage stretches
          </button>
        </div>
      )}

      <ul className="mt-3 space-y-1.5">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const dayOfWeek = day.getDay();
          const routineId = effectiveRoutineId(dateKey, dayOfWeek);
          const routine = routineFor(routineId);
          const hasOverride = data.stretchScheduleOverrides.some((o) => o.date === dateKey);
          const complete = isDayComplete(dateKey, routineId);

          return (
            <li key={dateKey} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-8 shrink-0">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>

              <div className="relative flex-1">
                <select
                  value={hasOverride ? routineId ?? NONE_OPTION : DEFAULT_OPTION}
                  onChange={(e) => setOverride(dateKey, e.target.value)}
                  className="field w-full py-1 text-sm text-transparent"
                >
                  {/* Prefixed "(default) " — same fix as WorkoutTracker/
                      MealTracker — so this never text-duplicates the real
                      routine/"No stretching" option below it when the default
                      schedule happens to point at a routine that's also in the
                      full list. This text is what shows once the dropdown is
                      clicked open — see the overlay note below for why it
                      doesn't show while closed. */}
                  <option value={DEFAULT_OPTION}>
                    (default){" "}
                    {routineFor(
                      data.stretchDefaultSchedule.find((d) => d.dayOfWeek === dayOfWeek)
                        ?.routineId ?? null
                    )?.name ?? "No stretching"}
                  </option>
                  <option value={NONE_OPTION}>No stretching</option>
                  {data.stretchRoutines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {/* Same overlay technique as WorkoutTracker: the select's own
                    text is transparent, so this decorative, pointer-events-none
                    layer is what's actually visible while closed — plain name,
                    no "(default) " prefix. Opening the dropdown still shows the
                    real disambiguated option text, since the native popped-open
                    list is drawn from each <option>'s own text, not this
                    overlay or the select's (transparent) color. */}
                <span className="pointer-events-none absolute inset-0 flex items-center">
                  <span className="pl-3 pr-7 truncate min-w-0 flex-1 text-sm">
                    {routine?.name ?? "No stretching"}
                  </span>
                </span>
              </div>

              <button
                onClick={() => setLogDateKey(dateKey)}
                className={`font-mono text-[11px] shrink-0 ${
                  complete ? "text-sage-light" : "text-clay hover:underline"
                }`}
              >
                {complete ? "✓ done" : "log"}
              </button>
            </li>
          );
        })}
      </ul>

      {manageOpen && (
        <ManageStretchesModal data={data} update={update} onClose={() => setManageOpen(false)} />
      )}

      {logDay && logDateKey && (
        <StretchLogModal
          key={logDateKey}
          date={logDay}
          dateKey={logDateKey}
          weekKey={weekKey}
          scheduledRoutineId={effectiveRoutineId(logDateKey, logDay.getDay())}
          data={data}
          update={update}
          onClose={() => setLogDateKey(null)}
        />
      )}
    </div>
  );
}
