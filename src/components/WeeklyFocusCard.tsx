"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";

type Props = {
  weekKey: string;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

export function WeeklyFocusCard({ weekKey, data, update }: Props) {
  const [goalDraft, setGoalDraft] = useState("");
  const focusEntry = data.weeklyFocuses.find((f) => f.weekKey === weekKey);
  const focus = focusEntry?.focus ?? "";
  const goals = focusEntry?.goals ?? [];

  function setFocus(text: string) {
    update((prev) => {
      const exists = prev.weeklyFocuses.some((f) => f.weekKey === weekKey);
      const weeklyFocuses = exists
        ? prev.weeklyFocuses.map((f) => (f.weekKey === weekKey ? { ...f, focus: text } : f))
        : [...prev.weeklyFocuses, { weekKey, focus: text, goals: [] }];
      return { ...prev, weeklyFocuses };
    });
  }

  function addGoal(e: React.FormEvent) {
    e.preventDefault();
    const text = goalDraft.trim();
    if (!text) return;

    update((prev) => {
      const exists = prev.weeklyFocuses.some((f) => f.weekKey === weekKey);
      const weeklyFocuses = exists
        ? prev.weeklyFocuses.map((f) =>
            f.weekKey === weekKey ? { ...f, goals: [...f.goals, text] } : f
          )
        : [...prev.weeklyFocuses, { weekKey, focus: "", goals: [text] }];
      return { ...prev, weeklyFocuses };
    });
    setGoalDraft("");
  }

  function removeGoal(index: number) {
    update((prev) => ({
      ...prev,
      weeklyFocuses: prev.weeklyFocuses.map((f) =>
        f.weekKey === weekKey ? { ...f, goals: f.goals.filter((_, i) => i !== index) } : f
      ),
    }));
  }

  return (
    <div className="card">
      <p className="eyebrow">Weekly focus</p>
      <input
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        placeholder="What's the theme of this week?"
        className="field w-full mt-3 font-medium"
      />

      <form onSubmit={addGoal} className="flex gap-2 mt-4">
        <input
          value={goalDraft}
          onChange={(e) => setGoalDraft(e.target.value)}
          placeholder="Add a supporting goal..."
          className="field flex-1 text-sm"
        />
        <button type="submit" className="btn-secondary">
          Add
        </button>
      </form>

      {goals.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {goals.map((goal, i) => (
            <li key={i} className="flex items-center gap-2 text-sm group">
              <span className="h-1 w-1 rounded-full bg-sage shrink-0" />
              <span className="flex-1">{goal}</span>
              <button
                onClick={() => removeGoal(i)}
                aria-label="Remove goal"
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-clay text-xs transition-opacity"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
