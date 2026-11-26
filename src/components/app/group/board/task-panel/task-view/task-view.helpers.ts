/**
 * How a task's stored values are worded in the panel. A row is always drawn,
 * so every one of these answers for a field the task does not carry too: a
 * blank reads as a rendering fault where "No" is the task's actual state.
 */

import { recurrenceLabel } from "@/lib/tasks/recurrence/recurrence";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { sinceLabel } from "@/lib/time/since/since";
import { fullName } from "@/lib/users/name/name";

export const NOT_SET = "Not set";

/** Words how often a task comes back, or says that it does not. */
export function repeatsLabel(type: string | undefined): string {
  return type ? recurrenceLabel(type) : "No";
}

/** Words a stretch of minutes the way somebody would say it. */
export function minutesLabel(minutes: number | undefined): string {
  if (!minutes) return NOT_SET;
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hoursSaid = `${hours} ${hours === 1 ? "hour" : "hours"}`;

  return rest === 0 ? hoursSaid : `${hoursSaid} ${rest} min`;
}

/**
 * Words who wrote the task down and when.
 *
 * @returns The line, or null where the task carries neither, which a task
 * being created does not.
 */
export function bylineLabel(task: Task | null, now: Date, timeZone: string): string | null {
  const author = fullName(task?.createdBy?.name, task?.createdBy?.lastName);
  const written = parseApiDateOrNull(task?.dateCreated);

  if (!author || !written) return null;

  return `Added by ${author} ${sinceLabel(written, now, timeZone)}`;
}
