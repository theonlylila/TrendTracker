"use client";

import { useState } from "react";
import type { DashboardData, LoggedExercise, LoggedSet, WorkoutLog } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  date: Date;
  dateKey: string;
  weekKey: string;
  scheduledTemplateId: string | null;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
};

function freshLog(
  dateKey: string,
  weekKey: string,
  data: DashboardData,
  templateId: string | null
): WorkoutLog {
  const template = data.workoutTemplates.find((w) => w.id === templateId);
  const exercises: LoggedExercise[] = (template?.exerciseIds ?? []).map((exId) => {
    const ex = data.exercises.find((e) => e.id === exId);
    return {
      id: crypto.randomUUID(),
      exerciseId: exId,
      exerciseName: ex?.name ?? "Exercise",
      sets: [],
    };
  });
  return {
    id: crypto.randomUUID(),
    weekKey,
    date: dateKey,
    workoutTemplateId: templateId,
    workoutName: template?.name ?? "Workout",
    weightUnit: "lbs",
    exercises,
    quality: null,
    fatigue: null,
    notes: "",
  };
}

export function WorkoutLogModal({
  date,
  dateKey,
  weekKey,
  scheduledTemplateId,
  data,
  update,
  onClose,
}: Props) {
  const existingAtOpen = data.workoutLogs.find((l) => l.date === dateKey);
  const [draft, setDraft] = useState<WorkoutLog>(
    () => existingAtOpen ?? freshLog(dateKey, weekKey, data, scheduledTemplateId)
  );
  const [saved, setSaved] = useState(!!existingAtOpen);

  function commit(next: WorkoutLog) {
    setDraft(next);
    setSaved(true);
    update((prev) => {
      const has = prev.workoutLogs.some((l) => l.id === next.id);
      return {
        ...prev,
        workoutLogs: has
          ? prev.workoutLogs.map((l) => (l.id === next.id ? next : l))
          : [...prev.workoutLogs, next],
      };
    });
  }

  function deleteLog() {
    update((prev) => ({
      ...prev,
      workoutLogs: prev.workoutLogs.filter((l) => l.id !== draft.id),
    }));
    onClose();
  }

  function addExercise(exerciseId: string) {
    if (!exerciseId) return;
    const ex = data.exercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    commit({
      ...draft,
      exercises: [
        ...draft.exercises,
        { id: crypto.randomUUID(), exerciseId, exerciseName: ex.name, sets: [] },
      ],
    });
  }

  function removeExercise(loggedExId: string) {
    commit({ ...draft, exercises: draft.exercises.filter((e) => e.id !== loggedExId) });
  }

  function addSet(loggedExId: string) {
    commit({
      ...draft,
      exercises: draft.exercises.map((e) =>
        e.id === loggedExId
          ? {
              ...e,
              sets: [
                ...e.sets,
                { id: crypto.randomUUID(), reps: null, weight: null, restSeconds: null },
              ],
            }
          : e
      ),
    });
  }

  function updateSet(loggedExId: string, setId: string, patch: Partial<LoggedSet>) {
    commit({
      ...draft,
      exercises: draft.exercises.map((e) =>
        e.id === loggedExId
          ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
          : e
      ),
    });
  }

  function removeSet(loggedExId: string, setId: string) {
    commit({
      ...draft,
      exercises: draft.exercises.map((e) =>
        e.id === loggedExId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
      ),
    });
  }

  function numberOrNull(value: string): number | null {
    return value === "" ? null : Number(value);
  }

  const availableToAdd = data.exercises.filter(
    (ex) => !draft.exercises.some((le) => le.exerciseId === ex.id)
  );

  return (
    <Modal
      title={date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })}
      onClose={onClose}
      wide
    >
      <div className="flex items-center gap-3 mb-4">
        <input
          value={draft.workoutName}
          onChange={(e) => commit({ ...draft, workoutName: e.target.value })}
          className="field flex-1 font-medium"
          placeholder="Workout name"
        />
        <select
          value={draft.weightUnit}
          onChange={(e) => commit({ ...draft, weightUnit: e.target.value as "lbs" | "kg" })}
          className="field text-sm"
        >
          <option value="lbs">lbs</option>
          <option value="kg">kg</option>
        </select>
      </div>

      <div className="space-y-4">
        {draft.exercises.map((le) => (
          <div key={le.id} className="border border-line rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{le.exerciseName}</p>
              <button
                onClick={() => removeExercise(le.id)}
                className="text-muted hover:text-clay text-xs px-1"
                aria-label="Remove exercise from log"
              >
                ✕
              </button>
            </div>

            {le.sets.length > 0 && (
              <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.25rem] gap-x-2 gap-y-1.5 items-center text-[11px] text-muted mb-1">
                <span></span>
                <span>Reps</span>
                <span>Weight ({draft.weightUnit})</span>
                <span>Rest (sec)</span>
                <span></span>
              </div>
            )}
            <div className="space-y-1.5">
              {le.sets.map((s, i) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.25rem] gap-x-2 items-center"
                >
                  <span className="font-mono text-xs text-muted">{i + 1}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps ?? ""}
                    onChange={(e) =>
                      updateSet(le.id, s.id, { reps: numberOrNull(e.target.value) })
                    }
                    className="field py-1 text-sm"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.weight ?? ""}
                    onChange={(e) =>
                      updateSet(le.id, s.id, { weight: numberOrNull(e.target.value) })
                    }
                    className="field py-1 text-sm"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.restSeconds ?? ""}
                    onChange={(e) =>
                      updateSet(le.id, s.id, { restSeconds: numberOrNull(e.target.value) })
                    }
                    className="field py-1 text-sm"
                  />
                  <button
                    onClick={() => removeSet(le.id, s.id)}
                    aria-label="Remove set"
                    className="text-muted hover:text-clay text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addSet(le.id)}
              className="btn-secondary mt-2 text-xs py-1 px-2.5"
            >
              + add set
            </button>
          </div>
        ))}

        {draft.exercises.length === 0 && (
          <p className="text-sm text-muted">No exercises yet — add one below.</p>
        )}

        {availableToAdd.length > 0 && (
          <select
            value=""
            onChange={(e) => addExercise(e.target.value)}
            className="field w-full text-sm"
          >
            <option value="">+ add exercise…</option>
            {availableToAdd.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-line space-y-3">
        <RatingRow
          label="Quality"
          value={draft.quality}
          onChange={(v) => commit({ ...draft, quality: v })}
        />
        <RatingRow
          label="Fatigue"
          value={draft.fatigue}
          onChange={(v) => commit({ ...draft, fatigue: v })}
        />
        <textarea
          value={draft.notes}
          onChange={(e) => commit({ ...draft, notes: e.target.value })}
          placeholder="Notes…"
          rows={2}
          className="field w-full text-sm"
        />
      </div>

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

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="eyebrow w-16 shrink-0">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-label={`${label} ${n} of 5`}
            className={`h-6 w-6 rounded-full border-2 text-[11px] font-mono flex items-center justify-center transition-colors ${
              value === n
                ? "bg-sage border-sage text-card"
                : "border-line text-muted hover:border-clay-light"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
