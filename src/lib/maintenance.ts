import type { MaintenanceTask } from "./types";
import { MAINTENANCE_CADENCE_DAYS } from "./types";

// A task with no completion history is due right away (see the comment on
// `lastCompletedDate` in types.ts) — a freshly added task shouldn't have to
// silently wait out a full cadence before it ever shows up. Otherwise, due
// = lastCompletedDate + cadence days, compared against `today` at local
// midnight so a task becomes due first thing in the morning on its due
// day, rather than the exact due status depending on what time of day you
// happen to load the page.
export function isTaskDue(task: MaintenanceTask, today: Date = new Date()): boolean {
  if (!task.lastCompletedDate) return true;
  const last = new Date(`${task.lastCompletedDate}T00:00:00`);
  const dueAt = last.getTime() + MAINTENANCE_CADENCE_DAYS[task.cadence] * 24 * 60 * 60 * 1000;
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return todayMidnight.getTime() >= dueAt;
}
