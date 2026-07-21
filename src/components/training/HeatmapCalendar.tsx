"use client";

import { addWeeks, getMondayOfWeek, getWeekDays, toDateKey } from "@/lib/week";

// Generic 12-week (by default) heatmap grid — Mon-Sun columns, one row per
// week. Used for workout consistency, stretch consistency, and steps-goal
// tracking on the Training Trends page. Each caller supplies its own
// `statusFor` classifier plus the styles/labels/legend for its statuses, so
// this component doesn't know anything about workouts/stretches/steps.

export type LegendItem = { swatch: string; label: string };

type Props = {
  weeksToShow?: number;
  statusFor: (day: Date) => string;
  statusStyles: Record<string, string>;
  statusLabels: Record<string, string>;
  legend: LegendItem[];
};

export function HeatmapCalendar({
  weeksToShow = 12,
  statusFor,
  statusStyles,
  statusLabels,
  legend,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekStart = getMondayOfWeek(today);
  const firstWeekStart = addWeeks(currentWeekStart, -(weeksToShow - 1));

  const weeks = Array.from({ length: weeksToShow }, (_, i) =>
    getWeekDays(addWeeks(firstWeekStart, i))
  );

  return (
    <div>
      <div className="flex items-center gap-1 mb-2 pl-14">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="w-5 text-center font-mono text-[10px] text-muted">
            {d}
          </span>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex items-center gap-1">
            <span className="w-12 shrink-0 font-mono text-[10px] text-muted">
              {week[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            {week.map((day) => {
              const status = statusFor(day);
              const dateKey = toDateKey(day);
              return (
                <span
                  key={dateKey}
                  title={`${day.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })} — ${statusLabels[status] ?? status}`}
                  className={`h-5 w-5 rounded-[5px] border ${statusStyles[status] ?? ""}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-muted font-mono">
        {legend.map((item) => (
          <Legend key={item.label} swatch={item.swatch} label={item.label} />
        ))}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-[3px] border ${swatch}`} />
      {label}
    </span>
  );
}
