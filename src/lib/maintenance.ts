import type { MaintenanceTask } from "./types";
import { MAINTENANCE_CADENCE_DAYS } from "./types";
import { addWeeks } from "./week";

// The literal calendar date this task next becomes due, or null if it's
// never been completed — a never-completed task is always immediately due
// (see the comment on `lastCompletedDate` in types.ts), so there's no
// meaningful "date" to compute for it.
export function nextDueDate(task: MaintenanceTask): Date | null {
  if (!task.lastCompletedDate) return null;
  const last = new Date(`${task.lastCompletedDate}T00:00:00`);
  return new Date(last.getTime() + MAINTENANCE_CADENCE_DAYS[task.cadence] * 24 * 60 * 60 * 1000);
}

// Whether this task belongs in the card for the given viewed week. This
// branches on one thing: has the task's due date already passed *in real
// life* (as of `today`), or is the viewed week purely a future forecast
// that hasn't happened yet?
//
// - Already overdue (or never completed): keep showing it in every week
//   from its due week onward — past, current, AND future — with no reset,
//   until it's marked done. This is the carry-over behavior: once you've
//   actually missed it, it stays "on" indefinitely rather than politely
//   waiting for its next cycle.
// - Not yet due: this is a look-ahead preview, not a real miss, so it
//   would be wrong to flip permanently "on" starting at the first
//   projected occurrence and never turn back off. Instead this projects
//   the periodic occurrences forward from the due date (due, due+cadence,
//   due+2*cadence, ...) and only shows the task due in whichever single
//   future week each occurrence actually falls in — so a monthly task
//   shows due once every ~30 days of forecasted weeks, not every week
//   from the first occurrence onward. If a projected occurrence's week
//   ever arrives in real time without being marked done, it becomes
//   "already overdue" per the branch above on the next render, and only
//   then does the carry-over behavior take over for it.
export function isDueByWeekEnd(task: MaintenanceTask, weekStart: Date, today: Date = new Date()): boolean {
  const due = nextDueDate(task);
  if (!due) return true;

  const weekEnd = addWeeks(weekStart, 1); // exclusive end = next Monday 00:00
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const alreadyOverdue = due.getTime() <= todayMidnight.getTime();

  if (alreadyOverdue) {
    return due.getTime() < weekEnd.getTime();
  }

  const cadenceMs = MAINTENANCE_CADENCE_DAYS[task.cadence] * 24 * 60 * 60 * 1000;
  let occurrence = due;
  while (occurrence.getTime() < weekStart.getTime()) {
    occurrence = new Date(occurrence.getTime() + cadenceMs);
  }
  return occurrence.getTime() < weekEnd.getTime();
}
