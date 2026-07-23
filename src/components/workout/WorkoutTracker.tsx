"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";
import { workoutWasPerformed } from "@/lib/types";
import { getWeekDays, toDateKey } from "@/lib/week";
import { ManageWorkoutsModal } from "./ManageWorkoutsModal";
import { WorkoutLogModal } from "./WorkoutLogModal";

type Props = {
  weekKey: string;
  weekStart: Date;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

const DEFAULT_OPTION = "__default";
const REST_OPTION = "__rest";

export function WorkoutTracker({ weekKey, weekStart, data, update }: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  const [logDateKey, setLogDateKey] = useState<string | null>(null);

  const days = getWeekDays(weekStart);
  const hasSetup = data.exercises.length > 0 && data.workoutTemplates.length > 0;

  function templateFor(id: string | null) {
    return id ? data.workoutTemplates.find((w) => w.id === id) ?? null : null;
  }

  function effectiveTemplateId(dateKey: string, dayOfWeek: number): string | null {
    const override = data.scheduleOverrides.find((o) => o.date === dateKey);
    if (override) return override.workoutTemplateId;
    return data.defaultSchedule.find((d) => d.dayOfWeek === dayOfWeek)?.workoutTemplateId ?? null;
  }

  function setOverride(dateKey: string, value: string) {
    update((prev) => {
      const withoutExisting = prev.scheduleOverrides.filter((o) => o.date !== dateKey);
      if (value === DEFAULT_OPTION) {
        return { ...prev, scheduleOverrides: withoutExisting };
      }
      const workoutTemplateId = value === REST_OPTION ? null : value;
      return {
        ...prev,
        scheduleOverrides: [
          ...withoutExisting,
          { id: crypto.randomUUID(), date: dateKey, workoutTemplateId },
        ],
      };
    });
  }

  const completedCount = days.filter((day) => {
    const dateKey = toDateKey(day);
    // Same rule as the Trends calendar: an emptied-out log doesn't count.
    return data.workoutLogs.some((l) => l.date === dateKey && workoutWasPerformed(l));
  }).length;

  const logDay = logDateKey ? days.find((d) => toDateKey(d) === logDateKey) ?? null : null;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Workouts</p>
        <div className="flex items-center gap-3">
          <p className="font-mono text-xs text-muted">{completedCount}/7 logged</p>
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
          <p className="text-sm text-muted">
            Add exercises and build a few workouts to get started.
          </p>
          <button onClick={() => setManageOpen(true)} className="btn-secondary shrink-0">
            Manage workouts
          </button>
        </div>
      )}

      <ul className="mt-3 space-y-1.5">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const dayOfWeek = day.getDay();
          const templateId = effectiveTemplateId(dateKey, dayOfWeek);
          const template = templateFor(templateId);
          const hasOverride = data.scheduleOverrides.some((o) => o.date === dateKey);
          const log = data.workoutLogs.find((l) => l.date === dateKey);
          // "✓ logged" should only show for a log that actually has exercises;
          // an empty leftover log shows "log" so you can reopen and finish it
          // (or leave it — either way it no longer counts as a done workout).
          const performed = !!log && workoutWasPerformed(log);

          return (
            <li key={dateKey} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-8 shrink-0">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>

              <select
                value={hasOverride ? templateId ?? REST_OPTION : DEFAULT_OPTION}
                onChange={(e) => setOverride(dateKey, e.target.value)}
                className="field flex-1 py-1 text-sm"
              >
                {/* Prefixed "(default) " so this never renders as an exact
                    text duplicate of the real template/"Rest day" option
                    below it — without this, whenever the default schedule
                    points at a template that's also in the full list (which
                    it always is), the same name would appear twice in the
                    dropdown with no way to tell them apart. */}
                <option value={DEFAULT_OPTION}>
                  (default){" "}
                  {templateFor(
                    data.defaultSchedule.find((d) => d.dayOfWeek === dayOfWeek)?.workoutTemplateId ??
                      null
                  )?.name ?? "Rest day"}
                </option>
                <option value={REST_OPTION}>Rest day</option>
                {data.workoutTemplates.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setLogDateKey(dateKey)}
                className={`font-mono text-[11px] shrink-0 ${
                  performed ? "text-sage-light" : "text-clay hover:underline"
                }`}
              >
                {performed ? "✓ logged" : "log"}
              </button>
            </li>
          );
        })}
      </ul>

      {manageOpen && (
        <ManageWorkoutsModal data={data} update={update} onClose={() => setManageOpen(false)} />
      )}

      {logDay && logDateKey && (
        <WorkoutLogModal
          key={logDateKey}
          date={logDay}
          dateKey={logDateKey}
          weekKey={weekKey}
          scheduledTemplateId={effectiveTemplateId(logDateKey, logDay.getDay())}
          data={data}
          update={update}
          onClose={() => setLogDateKey(null)}
        />
      )}
    </div>
  );
}
