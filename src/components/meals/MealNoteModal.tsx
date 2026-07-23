"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  mealSlot: number;
  dateKey: string;
  dayLabel: string; // e.g. "Monday, Jul 20" — display only
  recipeName: string | null; // whatever's currently scheduled — display only
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
};

// Deliberately looks up and writes by (mealSlot, dateKey) ONLY — never by
// recipeId. The note is a record of how a specific real day's meal felt, not
// a property of the recipe itself, so if the schedule dropdown for this
// slot/day is changed later (a different recipe assigned, or unassigned
// entirely), this note must stay exactly where it is rather than vanishing
// or silently reattaching to whatever recipe is picked next. `recipeName` is
// passed in purely so the modal can show "here's what was planned" for
// context while you write — it is never stored on the MealNote record.
export function MealNoteModal({
  mealSlot,
  dateKey,
  dayLabel,
  recipeName,
  data,
  update,
  onClose,
}: Props) {
  const existing = data.mealNotes.find((n) => n.mealSlot === mealSlot && n.date === dateKey);
  const [text, setText] = useState(existing?.notes ?? "");

  // Autosaves on every keystroke — same convention as everywhere else in the
  // app (no separate "Save" button exists anywhere in this codebase). An
  // empty textarea is treated as "no note" and removes the record entirely,
  // matching how WaterEntry/StepEntry clear out on an empty value, rather
  // than leaving a dangling empty MealNote sitting around forever.
  function handleChange(value: string) {
    setText(value);
    update((prev) => {
      const withoutExisting = prev.mealNotes.filter(
        (n) => !(n.mealSlot === mealSlot && n.date === dateKey)
      );
      if (value.trim() === "") {
        return { ...prev, mealNotes: withoutExisting };
      }
      return {
        ...prev,
        mealNotes: [
          ...withoutExisting,
          { id: existing?.id ?? crypto.randomUUID(), mealSlot, date: dateKey, notes: value },
        ],
      };
    });
  }

  return (
    <Modal title={`Meal ${mealSlot} note`} onClose={onClose}>
      <p className="text-xs text-muted mb-1">{dayLabel}</p>
      <p className="text-sm mb-3">
        {recipeName ?? <span className="text-muted">Nothing planned for this slot</span>}
      </p>

      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="How did this meal feel? e.g. bloated, energized…"
        rows={4}
        className="field w-full text-sm"
        autoFocus
      />

      <div className="flex justify-end mt-4">
        <button onClick={onClose} className="btn-secondary">
          Done
        </button>
      </div>
    </Modal>
  );
}
