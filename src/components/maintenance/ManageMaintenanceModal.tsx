"use client";

import { useState } from "react";
import type { DashboardData, MaintenanceCategory, MaintenanceCadence, MaintenanceTask } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  category: MaintenanceCategory;
  title: string;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
};

const CADENCE_OPTIONS: { value: MaintenanceCadence; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

// Shared by both the Cleaning and Beauty cards (see MaintenanceCard.tsx) —
// same flat-library CRUD shape as ManageSupplementsModal, just with a
// cadence select and a "last completed" date added, since this feature
// doesn't have a separate daily-check log the way supplements do; a task's
// `lastCompletedDate` field IS its only completion record.
export function ManageMaintenanceModal({ category, title, data, update, onClose }: Props) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [cadence, setCadence] = useState<MaintenanceCadence>("weekly");
  const [lastCompletedDate, setLastCompletedDate] = useState("");

  const tasks = data.maintenanceTasks.filter((t) => t.category === category);

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const task: MaintenanceTask = {
      id: crypto.randomUUID(),
      category,
      name: name.trim(),
      notes: notes.trim() || undefined,
      cadence,
      // Blank field = null = "due now" (see isTaskDue in src/lib/maintenance.ts).
      // A backfilled date is how you seed a task's first due date without
      // needing to complete it right now — e.g. "I already cleaned this
      // last Tuesday, don't nag me again until it's actually due."
      lastCompletedDate: lastCompletedDate || null,
    };
    update((prev) => ({ ...prev, maintenanceTasks: [...prev.maintenanceTasks, task] }));
    setName("");
    setNotes("");
    setCadence("weekly");
    setLastCompletedDate("");
  }

  function updateTask(id: string, patch: Partial<MaintenanceTask>) {
    update((prev) => ({
      ...prev,
      maintenanceTasks: prev.maintenanceTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }

  // No separate "checks" array to clean up here, unlike removeSupplement —
  // this feature has no per-date completion log at all, so the task itself
  // is the entire record. Deleting it removes everything about it in one step.
  function removeTask(id: string) {
    update((prev) => ({
      ...prev,
      maintenanceTasks: prev.maintenanceTasks.filter((t) => t.id !== id),
    }));
  }

  return (
    <Modal title={`Manage ${title.toLowerCase()}`} onClose={onClose}>
      <form onSubmit={addTask} className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Task name, e.g. ${category === "cleaning" ? "Clean the fridge" : "Trim nails"}`}
          className="field w-full text-sm"
        />
        <div className="flex gap-2">
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as MaintenanceCadence)}
            className="field flex-1 text-sm"
          >
            {CADENCE_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="flex-1">
            <input
              type="date"
              value={lastCompletedDate}
              onChange={(e) => setLastCompletedDate(e.target.value)}
              className="field w-full text-sm"
            />
            <p className="font-mono text-[10px] text-muted mt-1">
              Last completed (optional — blank means due now)
            </p>
          </div>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes..."
          rows={2}
          className="field w-full text-sm"
        />
        <button type="submit" className="btn-secondary">
          Add task
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted mt-4">No tasks yet — add your first one above.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {tasks.map((t) => (
            <li key={t.id} className="border border-line rounded-lg p-3">
              <div className="flex items-center gap-2">
                <input
                  value={t.name}
                  onChange={(e) => updateTask(t.id, { name: e.target.value })}
                  className="field flex-1 py-1.5 text-sm font-medium"
                />
                <button
                  onClick={() => removeTask(t.id)}
                  aria-label="Delete task"
                  className="text-muted hover:text-clay text-xs px-1"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <select
                  value={t.cadence}
                  onChange={(e) => updateTask(t.id, { cadence: e.target.value as MaintenanceCadence })}
                  className="field flex-1 py-1.5 text-sm"
                >
                  {CADENCE_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={t.lastCompletedDate ?? ""}
                  onChange={(e) => updateTask(t.id, { lastCompletedDate: e.target.value || null })}
                  className="field flex-1 py-1.5 text-sm"
                />
              </div>
              <textarea
                value={t.notes ?? ""}
                onChange={(e) => updateTask(t.id, { notes: e.target.value || undefined })}
                placeholder="Notes..."
                rows={2}
                className="field w-full mt-2 py-1.5 text-sm"
              />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
