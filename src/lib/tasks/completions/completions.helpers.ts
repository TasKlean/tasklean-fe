/**
 * The words a round reads in: what a press did, what became of one round, and
 * whether there is a round left to record at all.
 *
 * Zone-aware and never reading the zone, like everything else that words a
 * date here, so the server and the browser cannot disagree.
 */

import type { TaskCompletion, TaskOutcome } from "@/lib/tasks/completions/completions.types";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { dayKey, shiftDays, shortDate } from "@/lib/time/day/day";

/**
 * Says what recording a round did, which is mostly where the task goes next.
 *
 * @param now What counts as today, passed in so a test can fix the clock.
 * @returns One sentence, led by what the round was and naming the next round
 * for a task that comes back, or saying it is finished for one that does not.
 */
export function recordedLine(completion: TaskCompletion, now: Date, timeZone: string): string {
  const did = completion.outcome === "SKIPPED" ? "Skipped." : "Marked done.";
  const next = parseApiDateOrNull(completion.taskNextDueDate);

  if (!next || completion.taskStatus === "COMPLETED") return `${did} This task is finished.`;

  const key = dayKey(next, timeZone);
  const today = dayKey(now, timeZone);

  if (key === today) return `${did} It comes round again today.`;
  if (key === shiftDays(today, 1)) return `${did} It comes round again tomorrow.`;

  return `${did} It comes round again on ${shortDate(next, timeZone)}.`;
}

/**
 * Reports whether a task has a round left to record.
 *
 * @returns False for one that is finished for good. A repeating task is put
 * back to TODO when a round is recorded, so `COMPLETED` is only ever a one-off
 * that is done, and an archived task takes nothing at all.
 */
export function canRecordRound(task: Task): boolean {
  return task.status !== "COMPLETED" && task.status !== "ARCHIVED";
}

/**
 * Reports whether the round in hand may be skipped.
 *
 * @param now What counts as today, passed in like every other reading of the
 * clock here so the server and the browser agree.
 * @returns False for a round still ahead, which the endpoint refuses with
 * `TASK_ROUND_NOT_DUE`: doing one early is work that happened, where skipping
 * one early is a statement about a round that has not come. Judged by the day
 * rather than the instant, as the backend judges it.
 */
export function canSkipRound(task: Task, now: Date, timeZone: string): boolean {
  if (!canRecordRound(task)) return false;

  const due = parseApiDateOrNull(task.nextDueDate);

  return !due || dayKey(due, timeZone) <= dayKey(now, timeZone);
}

/**
 * The round already recorded that the next one has to wait for.
 *
 * @param rounds The task's own rounds, newest first, as the endpoint answers.
 * @returns That round's due date in words, or null where a round can be
 * recorded now. A task may be done one round ahead of schedule and the
 * backend refuses the next until that one has passed, so the press is drawn
 * dead rather than leading to `TASK_ROUND_ALREADY_AHEAD` once the work is
 * typed in.
 */
export function roundAlreadyDone(
  task: Task,
  rounds: readonly TaskCompletion[],
  now: Date,
  timeZone: string,
): string | null {
  const due = parseApiDateOrNull(task.nextDueDate);
  const latest = parseApiDateOrNull(rounds[0]?.dueDate);
  const today = dayKey(now, timeZone);

  // Due today or overdue: the round in hand is the one a press would record.
  if (!due || !latest || dayKey(due, timeZone) <= today) return null;

  return dayKey(latest, timeZone) >= today ? shortDate(latest, timeZone) : null;
}

/** Words what became of one round. */
export function outcomeLabel(outcome: TaskOutcome | undefined): string {
  if (outcome === "SKIPPED") return "Skipped";
  if (outcome === "MISSED") return "Missed";

  return "Done";
}
