"use client";

import type { DashboardData } from "@/lib/types";
import { workoutWasPerformed } from "@/lib/types";
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
  // "extra" = worked out on a rest day (bonus). A lighter green with a darker
  // sage border so it clearly reads as a *good* thing (green, like "done"),
  // while still looking distinct from a normal scheduled "done" day. Red
  // (blush) is now reserved exclusively for "missed," so red always = a miss.
  extra: "bg-sage-light border-sage",
  rest: "bg-card border-line",
  future: "bg-transparent border-line border-dashed opacity-50",
};

const STATUS_LABELS: Record<DayStatus, string> = {
  done: "Worked out",
  missed: "Missed scheduled workout",
  pending: "Scheduled for today — not logged yet",
  extra: "Worked out on a rest day",
  rest: "Rest day",
  future: "Upcoming",
};

export function ConsistencyCalendar({ data, weeksToShow = 12 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  function statusFor(day: Date): DayStatus {
    const dateKey = toDateKey(day);
    if (dateKey > todayKey) return "future";

    const dayOfWeek = day.getDay();
    const override = data.scheduleOverrides.find((o) => o.date === dateKey);
    const templateId = override
      ? override.workoutTemplateId
      : data.defaultSchedule.find((d) => d.dayOfWeek === dayOfWeek)?.workoutTemplateId ?? null;
    const isRestDay = templateId === null;
    // Only count a day as "worked out" if the log actually has exercises in
    // it — an emptied-out log shell shouldn't keep a day marked as done/bonus.
    const hasLog = data.workoutLogs.some((l) => l.date === dateKey && workoutWasPerformed(l));

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
        { swatch: "bg-sage border-sage", label: "worked out" },
        { swatch: "bg-blush/40 border-blush", label: "missed" },
        { swatch: "bg-sage-light border-sage", label: "bonus" },
        { swatch: "bg-card border-line", label: "rest day" },
      ]}
    />
  );
}
