"use client";

import { useState } from "react";
import type { DashboardData, Supplement } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
};

// No tabs here, unlike ManageMealsModal/ManageWorkoutsModal — there's no
// schedule to configure (every supplement applies every day), so this is
// just a flat library CRUD screen, the simplest of the "manage" modals.
export function ManageSupplementsModal({ data, update, onClose }: Props) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  function addSupplement(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const supplement: Supplement = {
      id: crypto.randomUUID(),
      name: name.trim(),
      notes: notes.trim() || undefined,
    };
    update((prev) => ({ ...prev, supplements: [...prev.supplements, supplement] }));
    setName("");
    setNotes("");
  }

  function updateSupplement(id: string, patch: Partial<Supplement>) {
    update((prev) => ({
      ...prev,
      supplements: prev.supplements.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  // Deleting a supplement removes every check logged against it too — a
  // check's entire meaning is "this supplement was taken on this date," so
  // once the supplement itself is gone there's nothing left for those
  // checks to refer to. Unlike recipes/workouts (which revert a schedule
  // slot to null), there's no slot to revert here — the check rows
  // themselves are simply deleted.
  function removeSupplement(id: string) {
    update((prev) => ({
      ...prev,
      supplements: prev.supplements.filter((s) => s.id !== id),
      supplementChecks: prev.supplementChecks.filter((c) => c.supplementId !== id),
    }));
  }

  return (
    <Modal title="Manage supplements" onClose={onClose}>
      <form onSubmit={addSupplement} className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Supplement name, e.g. Vitamin D"
          className="field w-full text-sm"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Dosage, timing, whatever you want to remember..."
          rows={2}
          className="field w-full text-sm"
        />
        <button type="submit" className="btn-secondary">
          Add supplement
        </button>
      </form>

      {data.supplements.length === 0 ? (
        <p className="text-sm text-muted mt-4">No supplements yet — add your first one above.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.supplements.map((s) => (
            <li key={s.id} className="border border-line rounded-lg p-3">
              <div className="flex items-center gap-2">
                <input
                  value={s.name}
                  onChange={(e) => updateSupplement(s.id, { name: e.target.value })}
                  className="field flex-1 py-1.5 text-sm font-medium"
                />
                <button
                  onClick={() => removeSupplement(s.id)}
                  aria-label="Delete supplement"
                  className="text-muted hover:text-clay text-xs px-1"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={s.notes ?? ""}
                onChange={(e) => updateSupplement(s.id, { notes: e.target.value || undefined })}
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
