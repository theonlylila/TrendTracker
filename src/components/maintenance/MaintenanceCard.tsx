"use client";

import { useState } from "react";
import type { DashboardData, MaintenanceCategory } from "@/lib/types";
import { isTaskDue } from "@/lib/maintenance";
import { toDateKey } from "@/lib/week";
import { ManageMaintenanceModal } from "./ManageMaintenanceModal";

type Props = {
  category: MaintenanceCategory;
  title: string;
  data: DashboardData;
  update: (updater: (prev: DashboardData) => DashboardData) => void;
};

// Deliberately no weekKey/weekStart props, unlike every other tracker card
// in WeekView. This card's contents never depend on which week is being
// viewed — a due task is due regardless of week navigation, so there's
// nothing week-scoped to pass in. See src/lib/maintenance.ts for the
// rolling-interval due-date logic this card is built around.
export function MaintenanceCard({ category, title, data, update }: Props) {
  const [manageOpen, setManageOpen] = useState(false);

  const tasksInCategory = data.maintenanceTasks.filter((t) => t.category === category);
  const dueTasks = tasksInCategory.filter((t) => isTaskDue(t));

  // Marking a task "done" just sets today as its last-completed date —
  // that alone moves its due date into the future by however many days
  // its cadence is, which is what makes it drop out of `dueTasks` above on
  // the next render. No separate log/history entry, unlike Workout/Cardio
  // logs — the task itself carries its own single most-recent completion.
  function markDone(taskId: string) {
    update((prev) => ({
      ...prev,
      maintenanceTasks: prev.maintenanceTasks.map((t) =>
        t.id === taskId ? { ...t, lastCompletedDate: toDateKey(new Date()) } : t
      ),
    }));
  }

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">{title}</p>
        <button
          onClick={() => setManageOpen(true)}
          className="font-mono text-[11px] text-clay hover:underline"
        >
          manage
        </button>
      </div>

      {tasksInCategory.length === 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 bg-sand/60 border border-line rounded-lg px-3 py-2.5">
          <p className="text-sm text-muted">
            Add {title.toLowerCase()} tasks to get started.
          </p>
          <button onClick={() => setManageOpen(true)} className="btn-secondary shrink-0">
            Manage {title.toLowerCase()}
          </button>
        </div>
      )}

      {/* A calm, plain confirmation — not a celebration banner. Matches
          your "don't make it look like a penalty" instruction from the
          other direction: just as an overdue task isn't styled as an
          alarm, being fully caught up isn't styled as an achievement. */}
      {tasksInCategory.length > 0 && dueTasks.length === 0 && (
        <p className="mt-3 text-sm text-muted">All caught up ✓</p>
      )}

      {dueTasks.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {dueTasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm truncate">{task.name}</p>
                {task.notes && (
                  <p className="font-mono text-[11px] text-muted truncate">{task.notes}</p>
                )}
              </div>
              {/* No color/weight distinction based on how overdue this is —
                  every due task's button looks identical, per your explicit
                  "no penalty styling" instruction. */}
              <button
                onClick={() => markDone(task.id)}
                className="font-mono text-[11px] text-clay hover:underline shrink-0"
              >
                done
              </button>
            </li>
          ))}
        </ul>
      )}

      {manageOpen && (
        <ManageMaintenanceModal
          category={category}
          title={title}
          data={data}
          update={update}
          onClose={() => setManageOpen(false)}
        />
      )}
    </div>
  );
}
