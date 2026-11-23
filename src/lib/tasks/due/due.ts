/**
 * How a chore's due date reads on the board. The nearest days are named rather
 * than dated, because "Due today" is what a reader acts on and a date is what
 * they then have to work out.
 *
 * Zone-aware and takes its zone, like everything in `time/day`: the server
 * renders this and the browser hydrates it, so a second opinion would make the
 * two disagree.
 */

import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { dayKey, numericDate, shiftDays, shortDate } from "@/lib/time/day/day";
import type { Task } from "@/lib/tasks/tasks/tasks.types";

// How a due date is painted. `overdue` is the only one that alarms; `soon` is
// today or tomorrow, which is a nudge rather than a warning.
export type DueTone = "overdue" | "soon" | "later";

export type DueLabel = {
  text: string;
  tone: DueTone;
  // The full date, for the title on a label that names a day instead.
  title: string;
};

/**
 * Words a chore's next due date.
 *
 * @param task The chore, whose `overdue` is the backend's own verdict against
 * its clock: it is trusted rather than recomputed, so one slow render cannot
 * disagree with the row beside it.
 * @param now What counts as today, passed down so a whole board agrees.
 * @param timeZone The reader's zone.
 * @returns The label, or null for a chore with no due date, which is a chore
 * nobody has put a date on rather than one that is late.
 */
export function dueLabel(task: Task, now: Date, timeZone: string): DueLabel | null {
  const due = parseApiDateOrNull(task.nextDueDate);
  if (!due) return null;

  const title = shortDate(due, timeZone);
  const key = dayKey(due, timeZone);
  const today = dayKey(now, timeZone);

  if (task.overdue) return { text: "Overdue", tone: "overdue", title };
  if (key === today) return { text: "Due today", tone: "soon", title };
  if (key === shiftDays(today, 1)) return { text: "Due tomorrow", tone: "soon", title };

  return { text: `Due ${title}`, tone: "later", title };
}

/**
 * Dates a chore in digits, for the column at the head of a row.
 *
 * @returns The same tone the worded label carries, so the numbers alone still
 * say a chore is late, and that wording as the title: a date in a column this
 * narrow cannot also say "tomorrow".
 */
export function dueDigits(task: Task, now: Date, timeZone: string): DueLabel | null {
  const due = parseApiDateOrNull(task.nextDueDate);
  const label = dueLabel(task, now, timeZone);

  if (!due || !label) return null;

  return { text: numericDate(due, now, timeZone), tone: label.tone, title: label.text };
}
