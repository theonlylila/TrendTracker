"use client";

import { useState } from "react";
import type { DashboardData, StretchLog } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  date: Date;
  dateKey: string;
  weekKey: string;
  scheduledRoutineId: string | null;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
};

function freshLog(
  dateKey: string,
  weekKey: string,
  data: DashboardData,
  routineId: string | null
): StretchLog {
  const routine = data.stretchRoutines.find((r) => r.id === routineId);
  return {
    id: crypto.randomUUID(),
    weekKey,
    date: dateKey,
    routineId,
    routineName: routine?.name ?? "Stretches",
    completedStretchIds: [],
  };
}

export function StretchLogModal({
  date,
  dateKey,
  weekKey,
  scheduledRoutineId,
  data,
  update,
  onClose,
}: Props) {
  const existingAtOpen = data.stretchLogs.find((l) => l.date === dateKey);
  const [draft, setDraft] = useState<StretchLog>(
    () => existingAtOpen ?? freshLog(dateKey, weekKey, data, scheduledRoutineId)
  );
  const [saved, setSaved] = useState(!!existingAtOpen);

  const routine = data.stretchRoutines.find((r) => r.id === draft.routineId);
  const stretchIds = routine?.stretchIds ?? [];

  function commit(next: StretchLog) {
    setDraft(next);
    setSaved(true);
    update((prev) => {
      const has = prev.stretchLogs.some((l) => l.id === next.id);
      return {
        ...prev,
        stretchLogs: has
          ? prev.stretchLogs.map((l) => (l.id === next.id ? next : l))
          : [...prev.stretchLogs, next],
      };
    });
  }

  function toggleStretch(stretchId: string) {
    const isDone = draft.completedStretchIds.includes(stretchId);
    commit({
      ...draft,
      completedStretchIds: isDone
        ? draft.completedStretchIds.filter((id) => id !== stretchId)
        : [...draft.completedStretchIds, stretchId],
    });
  }

  function markAllDone() {
    commit({ ...draft, completedStretchIds: [...stretchIds] });
  }

  function deleteLog() {
    update((prev) => ({
      ...prev,
      stretchLogs: prev.stretchLogs.filter((l) => l.id !== draft.id),
    }));
    onClose();
  }

  function stretchName(id: string) {
    return data.stretches.find((s) => s.id === id)?.name ?? "Stretch";
  }

  const allDone = stretchIds.length > 0 && stretchIds.every((id) => draft.completedStretchIds.includes(id));

  return (
    <Modal
      title={date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })}
      onClose={onClose}
    >
      <p className="text-sm font-medium mb-3">{draft.routineName}</p>

      {stretchIds.length === 0 ? (
        <p className="text-sm text-muted">
          No stretches assigned for this day. Add some via "Manage stretches".
        </p>
      ) : (
        <>
          <ul className="space-y-1.5">
            {stretchIds.map((id) => {
              const done = draft.completedStretchIds.includes(id);
              return (
                <li key={id} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleStretch(id)}
                    aria-label={done ? "Mark as not done" : "Mark as done"}
                    className={`checkbox ${done ? "checkbox-checked" : ""}`}
                  >
                    {done && <span className="checkbox-dot" />}
                  </button>
                  <span className="text-sm">{stretchName(id)}</span>
                </li>
              );
            })}
          </ul>

          <button
            onClick={markAllDone}
            disabled={allDone}
            className="btn-secondary mt-4 text-xs py-1.5 px-3 disabled:opacity-40"
          >
            Mark all as done
          </button>
        </>
      )}

      <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
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
