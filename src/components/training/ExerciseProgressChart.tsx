"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { SimpleLineChart } from "./SimpleLineChart";

type Metric = "weight" | "reps";

export function ExerciseProgressChart({ data }: { data: DashboardData }) {
  const exercisesWithLogs = useMemo(() => {
    const idsWithLogs = new Set(
      data.workoutLogs.flatMap((l) => l.exercises.map((e) => e.exerciseId))
    );
    return data.exercises.filter((ex) => idsWithLogs.has(ex.id));
  }, [data.exercises, data.workoutLogs]);

  const [exerciseId, setExerciseId] = useState<string>(exercisesWithLogs[0]?.id ?? "");
  const [metric, setMetric] = useState<Metric>("weight");

  const activeExerciseId = exerciseId || exercisesWithLogs[0]?.id || "";

  const sessions = useMemo(() => {
    if (!activeExerciseId) return [];
    return data.workoutLogs
      .filter((l) => l.exercises.some((e) => e.exerciseId === activeExerciseId))
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .map((l) => {
        const le = l.exercises.find((e) => e.exerciseId === activeExerciseId)!;
        const weights = le.sets.map((s) => s.weight).filter((w): w is number => w !== null);
        const topWeight = weights.length ? Math.max(...weights) : 0;
        const totalReps = le.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
        return {
          label: new Date(`${l.date}T00:00:00`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          topWeight,
          totalReps,
          unit: l.weightUnit,
        };
      });
  }, [data.workoutLogs, activeExerciseId]);

  if (exercisesWithLogs.length === 0) {
    return (
      <p className="text-sm text-muted">
        Log a few workouts and this will show how your weight and reps trend over time.
      </p>
    );
  }

  const points = sessions.map((s) => ({
    label: s.label,
    value: metric === "weight" ? s.topWeight : s.totalReps,
  }));
  const unit = metric === "weight" ? sessions[sessions.length - 1]?.unit ?? "lbs" : "reps";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={activeExerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
          className="field text-sm"
        >
          {exercisesWithLogs.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          <button
            onClick={() => setMetric("weight")}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              metric === "weight"
                ? "bg-clay text-card border-clay"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            Top weight
          </button>
          <button
            onClick={() => setMetric("reps")}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              metric === "reps"
                ? "bg-sage text-card border-sage"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            Total reps
          </button>
        </div>
      </div>

      {points.length < 2 ? (
        <p className="text-sm text-muted">Log this exercise at least twice to see a trend line.</p>
      ) : (
        <SimpleLineChart
          points={points}
          unit={unit}
          color={metric === "weight" ? "#d24b91" : "#9f88d4"}
        />
      )}
    </div>
  );
}
