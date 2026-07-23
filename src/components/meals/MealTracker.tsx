"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";
import { MEAL_SLOT_COUNT } from "@/lib/types";
import { getWeekDays, toDateKey } from "@/lib/week";
import { ManageMealsModal } from "./ManageMealsModal";
import { MealNoteModal } from "./MealNoteModal";

type Props = {
  weekKey: string;
  weekStart: Date;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

// Sentinel used only in the <select>, same pattern as WorkoutTracker's
// DEFAULT_OPTION/REST_OPTION: "use whatever the default schedule says" is a
// distinct choice from "explicitly plan nothing here," and both need to be
// selectable from the same dropdown alongside actual recipes.
const DEFAULT_OPTION = "__default";
const NONE_OPTION = "__none";

const MEAL_SLOTS = Array.from({ length: MEAL_SLOT_COUNT }, (_, i) => i + 1);

export function MealTracker({ weekKey, weekStart, data, update }: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  // Which (mealSlot, date) cell's note modal is currently open, if any.
  // Includes dayLabel/recipeName snapshotted at click time purely so the
  // modal has display context to show — see MealNoteModal for why those are
  // never written into the note itself.
  const [noteFor, setNoteFor] = useState<{
    mealSlot: number;
    dateKey: string;
    dayLabel: string;
    recipeName: string | null;
  } | null>(null);

  const days = getWeekDays(weekStart);
  const hasSetup = data.recipes.length > 0;

  function recipeName(id: string | null) {
    return id ? data.recipes.find((r) => r.id === id)?.name ?? null : null;
  }

  function defaultRecipeId(mealSlot: number, dayOfWeek: number): string | null {
    return (
      data.mealDefaultSchedule.find((d) => d.mealSlot === mealSlot && d.dayOfWeek === dayOfWeek)
        ?.recipeId ?? null
    );
  }

  function effectiveRecipeId(mealSlot: number, dateKey: string, dayOfWeek: number): string | null {
    const override = data.mealScheduleOverrides.find(
      (o) => o.mealSlot === mealSlot && o.date === dateKey
    );
    if (override) return override.recipeId;
    return defaultRecipeId(mealSlot, dayOfWeek);
  }

  function setOverride(mealSlot: number, dateKey: string, value: string) {
    update((prev) => {
      const withoutExisting = prev.mealScheduleOverrides.filter(
        (o) => !(o.mealSlot === mealSlot && o.date === dateKey)
      );
      if (value === DEFAULT_OPTION) {
        return { ...prev, mealScheduleOverrides: withoutExisting };
      }
      const recipeId = value === NONE_OPTION ? null : value;
      return {
        ...prev,
        mealScheduleOverrides: [
          ...withoutExisting,
          { id: crypto.randomUUID(), mealSlot, date: dateKey, recipeId },
        ],
      };
    });
  }

  function hasNote(mealSlot: number, dateKey: string) {
    return data.mealNotes.some((n) => n.mealSlot === mealSlot && n.date === dateKey);
  }

  function isChecked(mealSlot: number, dateKey: string) {
    return data.mealChecks.some((c) => c.mealSlot === mealSlot && c.date === dateKey);
  }

  function toggleChecked(mealSlot: number, dateKey: string) {
    update((prev) => {
      const exists = prev.mealChecks.some(
        (c) => c.mealSlot === mealSlot && c.date === dateKey
      );
      if (exists) {
        return {
          ...prev,
          mealChecks: prev.mealChecks.filter(
            (c) => !(c.mealSlot === mealSlot && c.date === dateKey)
          ),
        };
      }
      return {
        ...prev,
        mealChecks: [...prev.mealChecks, { id: crypto.randomUUID(), mealSlot, date: dateKey }],
      };
    });
  }

  // Only count cells that actually have a recipe assigned — an unplanned
  // slot has nothing to "eat," so it shouldn't drag down or pad the ratio.
  let plannedCount = 0;
  let eatenCount = 0;
  for (const day of days) {
    const dateKey = toDateKey(day);
    for (const mealSlot of MEAL_SLOTS) {
      const recipeId = effectiveRecipeId(mealSlot, dateKey, day.getDay());
      if (recipeId) {
        plannedCount++;
        if (isChecked(mealSlot, dateKey)) eatenCount++;
      }
    }
  }

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Meals</p>
        <div className="flex items-center gap-3">
          <p className="font-mono text-xs text-muted">
            {eatenCount}/{plannedCount} eaten
          </p>
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
          <p className="text-sm text-muted">Add recipes to your library to get started.</p>
          <button onClick={() => setManageOpen(true)} className="btn-secondary shrink-0">
            Manage meals
          </button>
        </div>
      )}

      {hasSetup && (
        <table className="mt-3 w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="text-left font-mono text-[11px] text-muted font-normal w-16 pb-1.5">
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
            {MEAL_SLOTS.map((mealSlot) => (
              <tr key={mealSlot}>
                <td className="font-mono text-[11px] text-muted align-top pt-1.5 pr-2 whitespace-nowrap">
                  Meal {mealSlot}
                </td>
                {days.map((day) => {
                  const dateKey = toDateKey(day);
                  const dayOfWeek = day.getDay();
                  const recipeId = effectiveRecipeId(mealSlot, dateKey, dayOfWeek);
                  const hasOverride = data.mealScheduleOverrides.some(
                    (o) => o.mealSlot === mealSlot && o.date === dateKey
                  );
                  const checked = isChecked(mealSlot, dateKey);

                  return (
                    <td key={dateKey} className="align-top px-1 py-1 min-w-[120px]">
                      <div className="relative">
                        <select
                          value={hasOverride ? recipeId ?? NONE_OPTION : DEFAULT_OPTION}
                          onChange={(e) => setOverride(mealSlot, dateKey, e.target.value)}
                          className="field w-full py-1 text-xs text-transparent"
                        >
                          {/* Prefixed "(default) " — same fix as
                              WorkoutTracker/StretchTracker — so this never
                              text-duplicates the real recipe/"Nothing planned"
                              option below it when the default schedule happens
                              to point at a recipe that's also in the full
                              list. This text is what shows once the dropdown
                              is clicked open — see the overlay note below for
                              why it doesn't show while closed. */}
                          <option value={DEFAULT_OPTION}>
                            (default){" "}
                            {recipeName(defaultRecipeId(mealSlot, dayOfWeek)) ?? "Nothing planned"}
                          </option>
                          <option value={NONE_OPTION}>Nothing planned</option>
                          {data.recipes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        {/* Same overlay technique as WorkoutTracker/
                            StretchTracker/CardioTracker: the select's own
                            text is transparent, so this decorative,
                            pointer-events-none layer is what's actually
                            visible while closed — plain name, no "(default) "
                            prefix. Opening the dropdown still shows the real
                            disambiguated option text, since the native
                            popped-open list is drawn from each <option>'s own
                            text, not this overlay or the select's
                            (transparent) color. */}
                        <span className="pointer-events-none absolute inset-0 flex items-center">
                          <span className="pl-3 pr-7 truncate min-w-0 flex-1 text-xs">
                            {recipeName(recipeId) ?? "Nothing planned"}
                          </span>
                        </span>
                      </div>

                      <button
                        onClick={() => toggleChecked(mealSlot, dateKey)}
                        disabled={!recipeId}
                        className={`mt-1 w-full font-mono text-[10px] rounded px-1 py-0.5 border transition-colors ${
                          !recipeId
                            ? "border-transparent text-transparent cursor-default"
                            : checked
                              ? "bg-sage-light border-sage text-ink"
                              : "border-clay-light border-dashed text-muted hover:text-clay"
                        }`}
                      >
                        {checked ? "✓ eaten" : "eaten?"}
                      </button>

                      {/* Always visible, even with nothing planned for this
                          slot — per your explicit ask, this isn't gated on
                          having a recipe assigned or being checked eaten,
                          unlike the "eaten?" button above. */}
                      <button
                        onClick={() =>
                          setNoteFor({
                            mealSlot,
                            dateKey,
                            dayLabel: day.toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            }),
                            recipeName: recipeName(recipeId),
                          })
                        }
                        className={`mt-1 w-full font-mono text-[10px] rounded px-1 py-0.5 border transition-colors ${
                          hasNote(mealSlot, dateKey)
                            ? "bg-clay-light border-clay-light text-card"
                            : "border-line text-muted hover:text-clay"
                        }`}
                      >
                        {hasNote(mealSlot, dateKey) ? "✎ noted" : "note"}
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
        <ManageMealsModal data={data} update={update} onClose={() => setManageOpen(false)} />
      )}

      {/* key forces a fresh mount per (mealSlot, date) — same pattern as
          WorkoutLogModal — so switching which cell's note you're editing
          without an in-between close never leaves stale local text behind. */}
      {noteFor && (
        <MealNoteModal
          key={`${noteFor.mealSlot}-${noteFor.dateKey}`}
          mealSlot={noteFor.mealSlot}
          dateKey={noteFor.dateKey}
          dayLabel={noteFor.dayLabel}
          recipeName={noteFor.recipeName}
          data={data}
          update={update}
          onClose={() => setNoteFor(null)}
        />
      )}
    </div>
  );
}
