"use client";

import { useState } from "react";
import type { DashboardData, Exercise, WorkoutTemplate } from "@/lib/types";
import { MUSCLE_GROUPS } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

type Props = {
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
  onClose: () => void;
  initialTab?: Tab;
};

type Tab = "exercises" | "workouts" | "schedule";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first, matching the rest of the app
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ManageWorkoutsModal({ data, update, onClose, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "exercises");

  return (
    <Modal title="Manage workouts" onClose={onClose} wide>
      <div className="flex gap-1 mb-5 border-b border-line">
        {(
          [
            ["exercises", "Exercises"],
            ["workouts", "Workouts"],
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

      {tab === "exercises" && <ExercisesTab data={data} update={update} />}
      {tab === "workouts" && <WorkoutsTab data={data} update={update} />}
      {tab === "schedule" && <ScheduleTab data={data} update={update} />}
    </Modal>
  );
}

function ExercisesTab({ data, update }: Pick<Props, "data" | "update">) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_GROUPS[0]);

  function addExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const exercise: Exercise = {
      id: crypto.randomUUID(),
      name: name.trim(),
      muscleGroup,
    };
    update((prev) => ({ ...prev, exercises: [...prev.exercises, exercise] }));
    setName("");
  }

  function updateExercise(id: string, patch: Partial<Exercise>) {
    update((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)),
    }));
  }

  function removeExercise(id: string) {
    update((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== id),
      workoutTemplates: prev.workoutTemplates.map((w) => ({
        ...w,
        exerciseIds: w.exerciseIds.filter((exId) => exId !== id),
      })),
    }));
  }

  return (
    <div>
      <form onSubmit={addExercise} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercise name, e.g. Barbell Squat"
          className="field flex-1 min-w-[180px] text-sm"
        />
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="field text-sm"
        >
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">
          Add
        </button>
      </form>

      {data.exercises.length === 0 ? (
        <p className="text-sm text-muted mt-4">No exercises yet — add your first one above.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {data.exercises.map((ex) => (
            <li key={ex.id} className="flex flex-wrap items-center gap-2 group">
              <input
                value={ex.name}
                onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                className="field flex-1 min-w-[140px] py-1.5 text-sm"
              />
              <select
                value={ex.muscleGroup}
                onChange={(e) => updateExercise(ex.id, { muscleGroup: e.target.value })}
                className="field py-1.5 text-sm"
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeExercise(ex.id)}
                aria-label="Delete exercise"
                className="text-muted hover:text-clay text-xs px-1"
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

function WorkoutsTab({ data, update }: Pick<Props, "data" | "update">) {
  const [name, setName] = useState("");

  function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const template: WorkoutTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      exerciseIds: [],
    };
    update((prev) => ({ ...prev, workoutTemplates: [...prev.workoutTemplates, template] }));
    setName("");
  }

  function renameTemplate(id: string, newName: string) {
    update((prev) => ({
      ...prev,
      workoutTemplates: prev.workoutTemplates.map((w) =>
        w.id === id ? { ...w, name: newName } : w
      ),
    }));
  }

  // Deleting a template cleans up every place that references it — the
  // recurring default schedule, one-off overrides, AND past logged
  // workouts. That last one matters: without it, a WorkoutLog would keep
  // pointing at a workoutTemplateId that no longer exists in
  // workoutTemplates, an orphaned reference nothing else in the app could
  // ever clean up later. Nulling it out (rather than deleting the log
  // itself) is safe because WorkoutLog already keeps its own workoutName
  // snapshot for display — the log still shows what you did, it just stops
  // being able to link back to a template that's gone.
  function removeTemplate(id: string) {
    update((prev) => ({
      ...prev,
      workoutTemplates: prev.workoutTemplates.filter((w) => w.id !== id),
      defaultSchedule: prev.defaultSchedule.map((d) =>
        d.workoutTemplateId === id ? { ...d, workoutTemplateId: null } : d
      ),
      scheduleOverrides: prev.scheduleOverrides.map((o) =>
        o.workoutTemplateId === id ? { ...o, workoutTemplateId: null } : o
      ),
      workoutLogs: prev.workoutLogs.map((l) =>
        l.workoutTemplateId === id ? { ...l, workoutTemplateId: null } : l
      ),
    }));
  }

  function addExerciseTo(templateId: string, exerciseId: string) {
    if (!exerciseId) return;
    update((prev) => ({
      ...prev,
      workoutTemplates: prev.workoutTemplates.map((w) =>
        w.id === templateId && !w.exerciseIds.includes(exerciseId)
          ? { ...w, exerciseIds: [...w.exerciseIds, exerciseId] }
          : w
      ),
    }));
  }

  function removeExerciseFrom(templateId: string, exerciseId: string) {
    update((prev) => ({
      ...prev,
      workoutTemplates: prev.workoutTemplates.map((w) =>
        w.id === templateId
          ? { ...w, exerciseIds: w.exerciseIds.filter((id) => id !== exerciseId) }
          : w
      ),
    }));
  }

  function moveExercise(templateId: string, index: number, dir: -1 | 1) {
    update((prev) => ({
      ...prev,
      workoutTemplates: prev.workoutTemplates.map((w) => {
        if (w.id !== templateId) return w;
        const next = [...w.exerciseIds];
        const target = index + dir;
        if (target < 0 || target >= next.length) return w;
        [next[index], next[target]] = [next[target], next[index]];
        return { ...w, exerciseIds: next };
      }),
    }));
  }

  function exerciseName(id: string) {
    return data.exercises.find((ex) => ex.id === id)?.name ?? "(deleted exercise)";
  }

  return (
    <div>
      <form onSubmit={addTemplate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='New workout name, e.g. "Leg Day"'
          className="field flex-1 text-sm"
        />
        <button type="submit" className="btn-secondary">
          Create
        </button>
      </form>

      {data.workoutTemplates.length === 0 ? (
        <p className="text-sm text-muted mt-4">
          No workouts yet — create one above, then add exercises to it.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {data.workoutTemplates.map((w) => {
            const available = data.exercises.filter((ex) => !w.exerciseIds.includes(ex.id));
            return (
              <li key={w.id} className="border border-line rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={w.name}
                    onChange={(e) => renameTemplate(w.id, e.target.value)}
                    className="field flex-1 py-1.5 text-sm font-medium"
                  />
                  <button
                    onClick={() => removeTemplate(w.id)}
                    aria-label="Delete workout"
                    className="text-muted hover:text-clay text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                {w.exerciseIds.length > 0 && (
                  <ul className="mt-2.5 space-y-1">
                    {w.exerciseIds.map((exId, i) => (
                      <li key={exId} className="flex items-center gap-2 text-sm">
                        <span className="flex-1">{exerciseName(exId)}</span>
                        <button
                          onClick={() => moveExercise(w.id, i, -1)}
                          disabled={i === 0}
                          aria-label="Move up"
                          className="text-muted hover:text-clay text-xs disabled:opacity-30 px-1"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveExercise(w.id, i, 1)}
                          disabled={i === w.exerciseIds.length - 1}
                          aria-label="Move down"
                          className="text-muted hover:text-clay text-xs disabled:opacity-30 px-1"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => removeExerciseFrom(w.id, exId)}
                          aria-label="Remove from workout"
                          className="text-muted hover:text-clay text-xs px-1"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {available.length > 0 ? (
                  <select
                    value=""
                    onChange={(e) => addExerciseTo(w.id, e.target.value)}
                    className="field w-full mt-2.5 py-1.5 text-sm"
                  >
                    <option value="">+ add exercise…</option>
                    {available.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                ) : data.exercises.length === 0 ? (
                  <p className="text-xs text-muted mt-2.5">
                    Add exercises in the Exercises tab first.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ScheduleTab({ data, update }: Pick<Props, "data" | "update">) {
  function setDefaultForDay(dayOfWeek: number, workoutTemplateId: string) {
    update((prev) => ({
      ...prev,
      defaultSchedule: prev.defaultSchedule.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, workoutTemplateId: workoutTemplateId || null }
          : d
      ),
    }));
  }

  return (
    <div>
      <p className="text-sm text-muted mb-3">
        Set what you do by default on each day. You can still swap a single day's workout
        from the week view without changing this.
      </p>
      <ul className="space-y-1.5">
        {DAY_ORDER.map((dayOfWeek) => {
          const entry = data.defaultSchedule.find((d) => d.dayOfWeek === dayOfWeek);
          return (
            <li key={dayOfWeek} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted w-20 shrink-0">
                {DAY_NAMES[dayOfWeek]}
              </span>
              <select
                value={entry?.workoutTemplateId ?? ""}
                onChange={(e) => setDefaultForDay(dayOfWeek, e.target.value)}
                className="field flex-1 py-1.5 text-sm"
              >
                <option value="">Rest day</option>
                {data.workoutTemplates.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
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
