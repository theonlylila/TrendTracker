"use client";

import { useState } from "react";
import type { CardioType, DashboardData } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
  initialTab?: Tab;
};

// Only 2 tabs, same reasoning as ManageMealsModal — cardio types assign
// directly to a day, there's no intermediate "combine into a template" tier
// the way WorkoutTemplate combines exercises.
type Tab = "types" | "schedule";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first, matching the rest of the app
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ManageCardioModal({ data, update, onClose, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "types");

  return (
    <Modal title="Manage cardio" onClose={onClose} wide>
      <div className="flex gap-1 mb-5 border-b border-line">
        {(
          [
            ["types", "Cardio types"],
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

      {tab === "types" && <TypesTab data={data} update={update} />}
      {tab === "schedule" && <ScheduleTab data={data} update={update} />}
    </Modal>
  );
}

function TypesTab({ data, update }: Pick<Props, "data" | "update">) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  function addCardioType(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const cardioType: CardioType = {
      id: crypto.randomUUID(),
      name: name.trim(),
      notes: notes.trim() || undefined,
    };
    update((prev) => ({ ...prev, cardioTypes: [...prev.cardioTypes, cardioType] }));
    setName("");
    setNotes("");
  }

  function updateCardioType(id: string, patch: Partial<CardioType>) {
    update((prev) => ({
      ...prev,
      cardioTypes: prev.cardioTypes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  // Deleting a cardio type cleans up every place that references it — the
  // recurring default schedule and any one-off overrides revert to "Rest
  // day" (null) rather than leaving a dangling ID around. Same cleanup
  // pattern as removeRecipe in ManageMealsModal. Existing CardioLogs are
  // left untouched (they snapshot cardioTypeName at logging time), so past
  // history stays intact and readable even after the type is gone.
  function removeCardioType(id: string) {
    update((prev) => ({
      ...prev,
      cardioTypes: prev.cardioTypes.filter((c) => c.id !== id),
      cardioDefaultSchedule: prev.cardioDefaultSchedule.map((d) =>
        d.cardioTypeId === id ? { ...d, cardioTypeId: null } : d
      ),
      cardioScheduleOverrides: prev.cardioScheduleOverrides.map((o) =>
        o.cardioTypeId === id ? { ...o, cardioTypeId: null } : o
      ),
    }));
  }

  return (
    <div>
      <form onSubmit={addCardioType} className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cardio type, e.g. Running"
          className="field w-full text-sm"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes... route, target pace, whatever you want to remember"
          rows={2}
          className="field w-full text-sm"
        />
        <button type="submit" className="btn-secondary">
          Add cardio type
        </button>
      </form>

      {data.cardioTypes.length === 0 ? (
        <p className="text-sm text-muted mt-4">No cardio types yet — add your first one above.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.cardioTypes.map((c) => (
            <li key={c.id} className="border border-line rounded-lg p-3">
              <div className="flex items-center gap-2">
                <input
                  value={c.name}
                  onChange={(e) => updateCardioType(c.id, { name: e.target.value })}
                  className="field flex-1 py-1.5 text-sm font-medium"
                />
                <button
                  onClick={() => removeCardioType(c.id)}
                  aria-label="Delete cardio type"
                  className="text-muted hover:text-clay text-xs px-1"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={c.notes ?? ""}
                onChange={(e) => updateCardioType(c.id, { notes: e.target.value || undefined })}
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
  function setDefaultFor(dayOfWeek: number, cardioTypeId: string) {
    update((prev) => ({
      ...prev,
      cardioDefaultSchedule: prev.cardioDefaultSchedule.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, cardioTypeId: cardioTypeId || null } : d
      ),
    }));
  }

  if (data.cardioTypes.length === 0) {
    return (
      <p className="text-sm text-muted">
        Add cardio types in the Cardio types tab first, then come back here to set your default
        weekly schedule.
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Set what cardio you do by default each day. You can still swap a single day from the week
        view without changing this.
      </p>
      <ul className="space-y-1.5">
        {DAY_ORDER.map((dayOfWeek) => {
          const entry = data.cardioDefaultSchedule.find((d) => d.dayOfWeek === dayOfWeek);
          return (
            <li key={dayOfWeek} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-20 shrink-0">
                {DAY_NAMES[dayOfWeek]}
              </span>
              <select
                value={entry?.cardioTypeId ?? ""}
                onChange={(e) => setDefaultFor(dayOfWeek, e.target.value)}
                className="field flex-1 py-1.5 text-sm"
              >
                <option value="">Rest day</option>
                {data.cardioTypes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
