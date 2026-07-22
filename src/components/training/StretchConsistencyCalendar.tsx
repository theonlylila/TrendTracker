"use client";

import type { DashboardData } from "@/lib/types";
import { toDateKey } from "@/lib/week";
import { HeatmapCalendar } from "./HeatmapCalendar";

type Props = {
  data: DashboardData;
  weeksToShow?: number;
};

type DayStatus = "done" | "missed" | "pending" | "rest" | "extra" | "future";

const STATUS_STYLES: Record<DayStatus, string> = {
  done: "bg-sage border-sage",
  missed: "bg-blush/40 border-blush",
  pending: "bg-transparent border-clay-light border-dashed",
  // Bonus stretching day — lighter green with a darker sage border, matching
  // the workout calendar. Green so it reads as a good thing, not a miss.
  extra: "bg-sage-light border-sage",
  rest: "bg-card border-line",
  future: "bg-transparent border-line border-dashed opacity-50",
};

const STATUS_LABELS: Record<DayStatus, string> = {
  done: "Stretched",
  missed: "Missed scheduled stretching",
  pending: "Scheduled for today — not logged yet",
  extra: "Stretched on a day with none scheduled",
  rest: "No stretching scheduled",
  future: "Upcoming",
};

export function StretchConsistencyCalendar({ data, weeksToShow = 12 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  function effectiveRoutineId(dateKey: string, dayOfWeek: number): string | null {
    const override = data.stretchScheduleOverrides.find((o) => o.date === dateKey);
    if (override) return override.routineId;
    return data.stretchDefaultSchedule.find((d) => d.dayOfWeek === dayOfWeek)?.routineId ?? null;
  }

  function statusFor(day: Date): DayStatus {
    const dateKey = toDateKey(day);
    if (dateKey > todayKey) return "future";

    const routineId = effectiveRoutineId(dateKey, day.getDay());
    const routine = routineId ? data.stretchRoutines.find((r) => r.id === routineId) : null;
    const isScheduled = !!routine && routine.stretchIds.length > 0;

    const log = data.stretchLogs.find((l) => l.date === dateKey);
    const didAnyStretching = !!log && log.completedStretchIds.length > 0;
    const didFullRoutine =
      isScheduled && !!log && routine!.stretchIds.every((id) => log.completedStretchIds.includes(id));

    if (!isScheduled) return didAnyStretching ? "extra" : "rest";
    if (didFullRoutine) return "done";
    return dateKey === todayKey ? "pending" : "missed";
  }

  return (
    <HeatmapCalendar
      weeksToShow={weeksToShow}
      statusFor={statusFor}
      statusStyles={STATUS_STYLES}
      statusLabels={STATUS_LABELS}
      legend={[
        { swatch: "bg-sage border-sage", label: "stretched" },
        { swatch: "bg-blush/40 border-blush", label: "missed" },
        { swatch: "bg-sage-light border-sage", label: "bonus" },
        { swatch: "bg-card border-line", label: "none scheduled" },
      ]}
    />
  );
}
