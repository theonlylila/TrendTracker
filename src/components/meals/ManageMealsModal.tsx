"use client";

import { useState } from "react";
import type { DashboardData, Recipe } from "@/lib/types";
import { MEAL_SLOT_COUNT } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
  initialTab?: Tab;
};

// Only 2 tabs, unlike the workout modal's 3 — recipes assign directly to a
// meal slot, there's no intermediate "combo" tier like WorkoutTemplate.
type Tab = "recipes" | "schedule";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first, matching the rest of the app
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MEAL_SLOTS = Array.from({ length: MEAL_SLOT_COUNT }, (_, i) => i + 1);

export function ManageMealsModal({ data, update, onClose, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "recipes");

  return (
    <Modal title="Manage meals" onClose={onClose} wide>
      <div className="flex gap-1 mb-5 border-b border-line">
        {(
          [
            ["recipes", "Recipes"],
            ["schedule", "Weekly schedule"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-clay text-clay"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "recipes" && <RecipesTab data={data} update={update} />}
      {tab === "schedule" && <ScheduleTab data={data} update={update} />}
    </Modal>
  );
}

function RecipesTab({ data, update }: Pick<Props, "data" | "update">) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  function addRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: name.trim(),
      notes: notes.trim() || undefined,
    };
    update((prev) => ({ ...prev, recipes: [...prev.recipes, recipe] }));
    setName("");
    setNotes("");
  }

  function updateRecipe(id: string, patch: Partial<Recipe>) {
    update((prev) => ({
      ...prev,
      recipes: prev.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  // Deleting a recipe cleans up every place that references it — both the
  // recurring default schedule and any one-off overrides — reverting those
  // slots back to "nothing planned" rather than leaving a dangling ID
  // around. Same cleanup pattern as removeTemplate in ManageWorkoutsModal.
  function removeRecipe(id: string) {
    update((prev) => ({
      ...prev,
      recipes: prev.recipes.filter((r) => r.id !== id),
      mealDefaultSchedule: prev.mealDefaultSchedule.map((d) =>
        d.recipeId === id ? { ...d, recipeId: null } : d
      ),
      mealScheduleOverrides: prev.mealScheduleOverrides.map((o) =>
        o.recipeId === id ? { ...o, recipeId: null } : o
      ),
    }));
  }

  return (
    <div>
      <form onSubmit={addRecipe} className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Recipe name, e.g. Overnight Oats"
          className="field w-full text-sm"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ingredients, instructions, whatever you want to remember..."
          rows={3}
          className="field w-full text-sm"
        />
        <button type="submit" className="btn-secondary">
          Add recipe
        </button>
      </form>

      {data.recipes.length === 0 ? (
        <p className="text-sm text-muted mt-4">No recipes yet — add your first one above.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.recipes.map((r) => (
            <li key={r.id} className="border border-line rounded-lg p-3">
              <div className="flex items-center gap-2">
                <input
                  value={r.name}
                  onChange={(e) => updateRecipe(r.id, { name: e.target.value })}
                  className="field flex-1 py-1.5 text-sm font-medium"
                />
                <button
                  onClick={() => removeRecipe(r.id)}
                  aria-label="Delete recipe"
                  className="text-muted hover:text-clay text-xs px-1"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={r.notes ?? ""}
                onChange={(e) => updateRecipe(r.id, { notes: e.target.value || undefined })}
                placeholder="Notes..."
                rows={2}
                className="field w-full mt-2 py-1.5 text-sm"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScheduleTab({ data, update }: Pick<Props, "data" | "update">) {
  function setDefaultFor(mealSlot: number, dayOfWeek: number, recipeId: string) {
    update((prev) => ({
      ...prev,
      mealDefaultSchedule: prev.mealDefaultSchedule.map((d) =>
        d.mealSlot === mealSlot && d.dayOfWeek === dayOfWeek
          ? { ...d, recipeId: recipeId || null }
          : d
      ),
    }));
  }

  if (data.recipes.length === 0) {
    return (
      <p className="text-sm text-muted">
        Add recipes in the Recipes tab first, then come back here to set your default weekly
        schedule.
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Set what you eat by default for each meal, each day. You can still swap a single day
        from the week view without changing this.
      </p>
      <div className="space-y-5">
        {MEAL_SLOTS.map((mealSlot) => (
          <div key={mealSlot}>
            <p className="eyebrow mb-2">Meal {mealSlot}</p>
            <ul className="space-y-1.5">
              {DAY_ORDER.map((dayOfWeek) => {
                const entry = data.mealDefaultSchedule.find(
                  (d) => d.mealSlot === mealSlot && d.dayOfWeek === dayOfWeek
                );
                return (
                  <li key={dayOfWeek} className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-muted w-20 shrink-0">
                      {DAY_NAMES[dayOfWeek]}
                    </span>
                    <select
                      value={entry?.recipeId ?? ""}
                      onChange={(e) => setDefaultFor(mealSlot, dayOfWeek, e.target.value)}
                      className="field flex-1 py-1.5 text-sm"
                    >
                      <option value="">Nothing planned</option>
                      {data.recipes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
