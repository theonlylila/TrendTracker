"use client";

import type { DashboardData } from "@/lib/types";
import { toDateKey } from "@/lib/week";
import { HeatmapCalendar } from "./HeatmapCalendar";

type Props = {
  data: DashboardData;
  weeksToShow?: number;
};

type DayStatus = "met" | "missed" | "pending" | "none" | "future";

const STATUS_STYLES: Record<DayStatus, string> = {
  met: "bg-sage border-sage",
  missed: "bg-blush/40 border-blush",
  pending: "bg-transparent border-clay-light border-dashed",
  none: "bg-card border-line",
  future: "bg-transparent border-line border-dashed opacity-50",
};

const STATUS_LABELS: Record<DayStatus, string> = {
  met: "Goal met",
  missed: "Goal missed",
  pending: "No entry yet — today",
  none: "No entry logged",
  future: "Upcoming",
};

// Exact copy of StepsConsistencyCalendar's structure/logic, swapped to read
// data.waterEntries/data.waterGoal instead of stepEntries/stepsGoal. Reusing
// the same `>=` comparison that WaterTracker.tsx (the weekly view) uses for
// its own "met" check means this calendar and the weekly view can never
// disagree about whether a given day hit the goal — they're both just two
// different renderings of the exact same underlying data and comparison.
export function WaterConsistencyCalendar({ data, weeksToShow = 12 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  function statusFor(day: Date): DayStatus {
    const dateKey = toDateKey(day);
    if (dateKey > todayKey) return "future";

    const entry = data.waterEntries.find((e) => e.date === dateKey);
    if (!entry) return dateKey === todayKey ? "pending" : "none";
    return entry.liters >= data.waterGoal ? "met" : "missed";
  }

  return (
    <HeatmapCalendar
      weeksToShow={weeksToShow}
      statusFor={statusFor}
      statusStyles={STATUS_STYLES}
      statusLabels={STATUS_LABELS}
      legend={[
        { swatch: "bg-sage border-sage", label: `${data.waterGoal}L+ water` },
        { swatch: "bg-blush/40 border-blush", label: "under goal" },
        { swatch: "bg-card border-line", label: "no entry" },
      ]}
    />
  );
}
