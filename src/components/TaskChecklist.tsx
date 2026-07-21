"use client";

import { useState } from "react";
import type { DashboardData, Task } from "@/lib/types";
import { burstConfetti } from "@/lib/confetti";
import { playPop } from "@/lib/sound";

type Props = {
  weekKey: string;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

export function TaskChecklist({ weekKey, data, update }: Props) {
  const [draft, setDraft] = useState("");
  const tasks = data.tasks.filter((t) => t.weekKey === weekKey);

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      weekKey,
      createdAt: new Date().toISOString(),
    };

    update((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    setDraft("");
  }

  function toggleTask(id: string, e: React.MouseEvent<HTMLButtonElement>) {
    const target = tasks.find((t) => t.id === id);
    const completing = target && !target.completed;

    if (completing) {
      const rect = e.currentTarget.getBoundingClientRect();
      burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      playPop();
    }

    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  }

  function removeTask(id: string) {
    update((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }

  return (
    <div className="card">
      <p className="eyebrow">This week's tasks</p>

      <form onSubmit={addTask} className="flex gap-2 my-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task..."
          maxLength={200}
          className="field flex-1"
        />
        <button type="submit" className="btn-primary">
          Add
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted">Nothing on the list yet.</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 group">
              <button
                onClick={(e) => toggleTask(task.id, e)}
                aria-label={task.completed ? "Mark as not done" : "Mark as done"}
                className={`checkbox ${task.completed ? "checkbox-checked" : ""}`}
              >
                {task.completed && <span className="checkbox-dot" />}
              </button>
              <span
                className={`text-sm flex-1 py-1.5 ${
                  task.completed ? "line-through text-muted" : "text-ink"
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => removeTask(task.id)}
                aria-label="Remove task"
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
