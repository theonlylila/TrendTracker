"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";
import { getWeekDays, toDateKey } from "@/lib/week";
import { ManageCardioModal } from "./ManageCardioModal";
import { CardioLogModal } from "./CardioLogModal";

type Props = {
  weekKey: string;
  weekStart: Date;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

const DEFAULT_OPTION = "__default";
const REST_OPTION = "__rest";

// Deliberately structured as a near-copy of WorkoutTracker.tsx — one row per
// day, a schedule dropdown (default vs. per-date override, "Rest day" =
// null), and a "log"/"✓ logged" button. The one real simplification: a
// CardioLog existing for a date IS "performed" — there's no exercises array
// to check for emptiness, since a cardio log has nothing nested inside it
// (see CardioLog's comment in types.ts).
export function CardioTracker({ weekKey, weekStart, data, update }: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  const [logDateKey, setLogDateKey] = useState<string | null>(null);

  const days = getWeekDays(weekStart);
  const hasSetup = data.cardioTypes.length > 0;

  function cardioTypeFor(id: string | null) {
    return id ? data.cardioTypes.find((c) => c.id === id) ?? null : null;
  }

  function effectiveCardioTypeId(dateKey: string, dayOfWeek: number): string | null {
    const override = data.cardioScheduleOverrides.find((o) => o.date === dateKey);
    if (override) return override.cardioTypeId;
    return data.cardioDefaultSchedule.find((d) => d.dayOfWeek === dayOfWeek)?.cardioTypeId ?? null;
  }

  function setOverride(dateKey: string, value: string) {
    update((prev) => {
      const withoutExisting = prev.cardioScheduleOverrides.filter((o) => o.date !== dateKey);
      if (value === DEFAULT_OPTION) {
        return { ...prev, cardioScheduleOverrides: withoutExisting };
      }
      const cardioTypeId = value === REST_OPTION ? null : value;
      return {
        ...prev,
        cardioScheduleOverrides: [
          ...withoutExisting,
          { id: crypto.randomUUID(), date: dateKey, cardioTypeId },
        ],
      };
    });
  }

  const completedCount = days.filter((day) => {
    const dateKey = toDateKey(day);
    return data.cardioLogs.some((l) => l.date === dateKey);
  }).length;

  const logDay = logDateKey ? days.find((d) => toDateKey(d) === logDateKey) ?? null : null;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Cardio</p>
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
          <p className="text-sm text-muted">Add cardio types to your library to get started.</p>
          <button onClick={() => setManageOpen(true)} className="btn-secondary shrink-0">
            Manage cardio
          </button>
        </div>
      )}

      <ul className="mt-3 space-y-1.5">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const dayOfWeek = day.getDay();
          const cardioTypeId = effectiveCardioTypeId(dateKey, dayOfWeek);
          const cardioType = cardioTypeFor(cardioTypeId);
          const hasOverride = data.cardioScheduleOverrides.some((o) => o.date === dateKey);
          const logged = data.cardioLogs.some((l) => l.date === dateKey);

          return (
            <li key={dateKey} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-8 shrink-0">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>

              <div className="relative flex-1">
                <select
                  value={hasOverride ? cardioTypeId ?? REST_OPTION : DEFAULT_OPTION}
                  onChange={(e) => setOverride(dateKey, e.target.value)}
                  className="field w-full py-1 text-sm text-transparent"
                >
                  {/* Prefixed "(default) " so this never text-duplicates the
                      real cardio type/"Rest day" option below it when the
                      default schedule happens to point at a type that's also
                      in the full list. This text is what shows once the
                      dropdown is clicked open — see the overlay note below
                      for why it doesn't show while closed. */}
                  <option value={DEFAULT_OPTION}>
                    (default){" "}
                    {cardioTypeFor(
                      data.cardioDefaultSchedule.find((d) => d.dayOfWeek === dayOfWeek)
                        ?.cardioTypeId ?? null
                    )?.name ?? "Rest day"}
                  </option>
                  <option value={REST_OPTION}>Rest day</option>
                  {data.cardioTypes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {/* Same overlay technique as WorkoutTracker/StretchTracker:
                    the select's own text is transparent, so this decorative,
                    pointer-events-none layer is what's actually visible while
                    closed — plain name, no "(default) " prefix. Opening the
                    dropdown still shows the real disambiguated option text,
                    since the native popped-open list is drawn from each
                    <option>'s own text, not this overlay or the select's
                    (transparent) color. */}
                <span className="pointer-events-none absolute inset-0 flex items-center">
                  <span className="pl-3 pr-7 truncate min-w-0 flex-1 text-sm">
                    {cardioType?.name ?? "Rest day"}
                  </span>
                </span>
              </div>

              <button
                onClick={() => setLogDateKey(dateKey)}
                className={`font-mono text-[11px] shrink-0 ${
                  logged ? "text-sage-light" : "text-clay hover:underline"
                }`}
              >
                {logged ? "✓ logged" : "log"}
              </button>
            </li>
          );
        })}
      </ul>

      {manageOpen && (
        <ManageCardioModal data={data} update={update} onClose={() => setManageOpen(false)} />
      )}

      {logDay && logDateKey && (
        <CardioLogModal
          key={logDateKey}
          date={logDay}
          dateKey={logDateKey}
          weekKey={weekKey}
          scheduledCardioTypeId={effectiveCardioTypeId(logDateKey, logDay.getDay())}
          data={data}
          update={update}
          onClose={() => setLogDateKey(null)}
        />
      )}
    </div>
  );
}
