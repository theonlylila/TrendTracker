"use client";

import { useState } from "react";
import type { CardioLog, DashboardData } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  date: Date;
  dateKey: string;
  weekKey: string;
  scheduledCardioTypeId: string | null;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
};

function freshLog(
  dateKey: string,
  weekKey: string,
  data: DashboardData,
  cardioTypeId: string | null
): CardioLog {
  const cardioType = data.cardioTypes.find((c) => c.id === cardioTypeId);
  return {
    id: crypto.randomUUID(),
    weekKey,
    date: dateKey,
    cardioTypeId,
    cardioTypeName: cardioType?.name ?? "Cardio",
    notes: "",
  };
}

// A deliberately much simpler sibling of WorkoutLogModal — no sets/reps
// structure to build, since a CardioLog is just a type selection plus one
// notes field (where duration, calories, heart rate zone, etc. all get
// jotted down as free text, per your explicit choice). Same autosave-as-you-
// go pattern (`commit`), same saved/delete/Done affordances.
export function CardioLogModal({
  date,
  dateKey,
  weekKey,
  scheduledCardioTypeId,
  data,
  update,
  onClose,
}: Props) {
  const existingAtOpen = data.cardioLogs.find((l) => l.date === dateKey);
  const [draft, setDraft] = useState<CardioLog>(
    () => existingAtOpen ?? freshLog(dateKey, weekKey, data, scheduledCardioTypeId)
  );
  const [saved, setSaved] = useState(!!existingAtOpen);

  function commit(next: CardioLog) {
    setDraft(next);
    setSaved(true);
    update((prev) => {
      const has = prev.cardioLogs.some((l) => l.id === next.id);
      return {
        ...prev,
        cardioLogs: has
          ? prev.cardioLogs.map((l) => (l.id === next.id ? next : l))
          : [...prev.cardioLogs, next],
      };
    });
  }

  function deleteLog() {
    update((prev) => ({
      ...prev,
      cardioLogs: prev.cardioLogs.filter((l) => l.id !== draft.id),
    }));
    onClose();
  }

  function setCardioType(value: string) {
    const cardioTypeId = value === "" ? null : value;
    const cardioType = data.cardioTypes.find((c) => c.id === cardioTypeId);
    commit({ ...draft, cardioTypeId, cardioTypeName: cardioType?.name ?? "Cardio" });
  }

  return (
    <Modal
      title={date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })}
      onClose={onClose}
    >
      <select
        value={draft.cardioTypeId ?? ""}
        onChange={(e) => setCardioType(e.target.value)}
        className="field w-full text-sm"
      >
        <option value="">Select cardio type…</option>
        {data.cardioTypes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <textarea
        value={draft.notes}
        onChange={(e) => commit({ ...draft, notes: e.target.value })}
        placeholder="Notes… e.g. duration, calories burned, heart rate zone"
        rows={4}
        className="field w-full text-sm mt-3"
      />

      <div className="mt-4 flex items-center justify-between">
        {saved ? (
          <button onClick={deleteLog} className="text-xs text-muted hover:text-clay">
            Delete this log
          </button>
        ) : (
          <span />
        )}
        <button onClick={onClose} className="btn-secondary">
          Done
        </button>
      </div>
    </Modal>
  );
}
