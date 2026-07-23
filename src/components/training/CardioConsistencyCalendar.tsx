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
  // "extra" = did cardio on a rest day (bonus) — same green-but-lighter
  // convention as ConsistencyCalendar's workout version, so red (blush)
  // stays reserved exclusively for "missed."
  extra: "bg-sage-light border-sage",
  rest: "bg-card border-line",
  future: "bg-transparent border-line border-dashed opacity-50",
};

const STATUS_LABELS: Record<DayStatus, string> = {
  done: "Did cardio",
  missed: "Missed scheduled cardio",
  pending: "Scheduled for today — not logged yet",
  extra: "Did cardio on a rest day",
  rest: "Rest day",
  future: "Upcoming",
};

// Near-exact copy of ConsistencyCalendar, with one real simplification: a
// CardioLog existing for a date IS "performed" — there's no exercises array
// to check for emptiness the way workoutWasPerformed does, since a cardio
// log has nothing nested inside it that could be "empty" besides not
// existing at all (see CardioLog's comment in types.ts).
export function CardioConsistencyCalendar({ data, weeksToShow = 12 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  function statusFor(day: Date): DayStatus {
    const dateKey = toDateKey(day);
    if (dateKey > todayKey) return "future";

    const dayOfWeek = day.getDay();
    const override = data.cardioScheduleOverrides.find((o) => o.date === dateKey);
    const cardioTypeId = override
      ? override.cardioTypeId
      : data.cardioDefaultSchedule.find((d) => d.dayOfWeek === dayOfWeek)?.cardioTypeId ?? null;
    const isRestDay = cardioTypeId === null;
    const hasLog = data.cardioLogs.some((l) => l.date === dateKey);

    if (isRestDay) return hasLog ? "extra" : "rest";
    if (hasLog) return "done";
    return dateKey === todayKey ? "pending" : "missed";
  }

  return (
    <HeatmapCalendar
      weeksToShow={weeksToShow}
      statusFor={statusFor}
      statusStyles={STATUS_STYLES}
      statusLabels={STATUS_LABELS}
      legend={[
        { swatch: "bg-sage border-sage", label: "did cardio" },
        { swatch: "bg-blush/40 border-blush", label: "missed" },
        { swatch: "bg-sage-light border-sage", label: "bonus" },
        { swatch: "bg-card border-line", label: "rest day" },
      ]}
    />
  );
}
