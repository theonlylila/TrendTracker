"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";
import { getWeekDays, toDateKey } from "@/lib/week";
import { ManageSupplementsModal } from "./ManageSupplementsModal";

type Props = {
  weekKey: string;
  weekStart: Date;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

export function SupplementTracker({ weekKey, weekStart, data, update }: Props) {
  const [manageOpen, setManageOpen] = useState(false);

  const days = getWeekDays(weekStart);
  const hasSetup = data.supplements.length > 0;

  function isChecked(supplementId: string, dateKey: string) {
    return data.supplementChecks.some((c) => c.supplementId === supplementId && c.date === dateKey);
  }

  function toggleChecked(supplementId: string, dateKey: string) {
    update((prev) => {
      const exists = prev.supplementChecks.some(
        (c) => c.supplementId === supplementId && c.date === dateKey
      );
      if (exists) {
        return {
          ...prev,
          supplementChecks: prev.supplementChecks.filter(
            (c) => !(c.supplementId === supplementId && c.date === dateKey)
          ),
        };
      }
      return {
        ...prev,
        supplementChecks: [
          ...prev.supplementChecks,
          { id: crypto.randomUUID(), supplementId, date: dateKey },
        ],
      };
    });
  }

  // Two counters, per your request: "practiced" (took at least one
  // supplement that day) and "full day" (took every supplement in the
  // library that day). Both walk the same 7 dates but ask a different
  // question, so a day where you took 1 of 4 supplements shows up in
  // "practiced" but not "full day" — neither number alone would capture
  // that distinction.
  let practicedCount = 0;
  let fullDayCount = 0;
  if (hasSetup) {
    for (const day of days) {
      const dateKey = toDateKey(day);
      const takenCount = data.supplements.filter((s) => isChecked(s.id, dateKey)).length;
      if (takenCount > 0) practicedCount++;
      if (takenCount === data.supplements.length) fullDayCount++;
    }
  }

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Supplements</p>
        <div className="flex items-center gap-3">
          {hasSetup && (
            <p className="font-mono text-xs text-muted">
              Practiced: {practicedCount}/7 &middot; Full day: {fullDayCount}/7
            </p>
          )}
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
          <p className="text-sm text-muted">Add supplements to your library to get started.</p>
          <button onClick={() => setManageOpen(true)} className="btn-secondary shrink-0">
            Manage supplements
          </button>
        </div>
      )}

      {hasSetup && (
        <table className="mt-3 w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="text-left font-mono text-[11px] text-muted font-normal w-24 pb-1.5">
                {" "}
              </th>
              {days.map((day) => (
                <th
                  key={toDateKey(day)}
                  className="text-left font-mono text-[11px] text-muted font-normal pb-1.5 px-1"
                >
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.supplements.map((supplement) => (
              <tr key={supplement.id}>
                <td className="font-mono text-[11px] text-muted align-top pt-1.5 pr-2 whitespace-nowrap">
                  {supplement.name}
                </td>
                {days.map((day) => {
                  const dateKey = toDateKey(day);
                  const checked = isChecked(supplement.id, dateKey);

                  return (
                    <td key={dateKey} className="align-top px-1 py-1 min-w-[90px]">
                      <button
                        onClick={() => toggleChecked(supplement.id, dateKey)}
                        className={`w-full font-mono text-[10px] rounded px-1 py-1 border transition-colors ${
                          checked
                            ? "bg-sage-light border-sage text-ink"
                            : "border-clay-light border-dashed text-muted hover:text-clay"
                        }`}
                      >
                        {checked ? "✓ taken" : "taken?"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {manageOpen && (
        <ManageSupplementsModal
          data={data}
          update={update}
          onClose={() => setManageOpen(false)}
        />
      )}
    </div>
  );
}
