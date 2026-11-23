/**
 * Turns the chore a form posted into the body the task endpoints take.
 *
 * The due date is where the work is. A form holds a calendar day and a clock
 * time, both meaningless without a zone, and the endpoint wants one instant
 * carrying an offset. The zone is passed in like every other zone-aware call
 * here, never read, so the server and the browser cannot disagree.
 */

import type { Task, TaskWriteRequest } from "@/lib/tasks/tasks/tasks.types";
import { parseApiDateOrNull, toApiOffsetDate } from "@/lib/time/api-date/api-date";
import { dayKey, instantOn, timeOfDay } from "@/lib/time/day/day";
import type { TaskFields, TaskValues } from "@/lib/validation/forms/task.schema/task.schema";

// What a date with no time means. The end of the day rather than its start, so
// a chore due Tuesday is overdue on Wednesday and not at Tuesday midnight.
const END_OF_DAY = "23:59";

/**
 * Builds the request body for a create or a save.
 *
 * @param fields The chore as the form posted it, already parsed.
 * @param timeZone The reader's own zone, which the due date is meant in.
 * @returns Every field the chore will then have. Anything the reader left
 * empty is absent, which is how the endpoint is told to clear it.
 */
export function taskWriteRequest(fields: TaskFields, timeZone: string): TaskWriteRequest {
  return {
    name: fields.name,
    priority: fields.priority,
    description: fields.description,
    categoryId: fields.categoryId,
    tagNames: fields.tagNames,
    assignedToUid: fields.assignedToUid,
    nextDueDate: fields.dueDate
      ? toApiOffsetDate(instantOn(fields.dueDate, fields.dueTime ?? END_OF_DAY, timeZone))
      : undefined,
    recurrenceType: fields.recurrenceType,
    requiresPhotoProof: fields.requiresPhotoProof,
    estimatedTimeMinutes: fields.estimatedTimeMinutes,
    photoUid: fields.photoUid,
  };
}

/**
 * Splits a stored instant back into the two fields a form holds.
 *
 * @returns The day and the clock time where the reader is. The time is blank
 * for the end of a day, so a chore saved as "Tuesday" opens as Tuesday with no
 * time rather than as 23:59, which is not what anybody typed.
 */
export function dueFields(due: Date | null, timeZone: string): { date: string; time: string } {
  if (!due) return { date: "", time: "" };

  const time = timeOfDay(due, timeZone);

  return { date: dayKey(due, timeZone), time: time === END_OF_DAY ? "" : time };
}

/**
 * Fills the form from a chore, or empties it for one that does not exist yet.
 *
 * @param task The chore being edited, or null while creating one.
 * @param timeZone The reader's own zone, which the stored due date is read in.
 * @returns Every field as a string the form can hold, which is why a missing
 * number is `""` rather than absent: a control with nothing in it is empty, not
 * unset.
 */
export function taskValues(task: Task | null, timeZone: string): TaskValues {
  const due = dueFields(parseApiDateOrNull(task?.nextDueDate), timeZone);

  return {
    name: task?.name ?? "",
    description: task?.description ?? "",
    priority: task?.priority ?? "",
    categoryId: task?.categoryId ? String(task.categoryId) : "",
    tagNames: (task?.tags ?? []).flatMap((tag) => (tag.name ? [tag.name] : [])),
    assignedToUid: task?.assignedTo?.memberUid ?? "",
    dueDate: due.date,
    dueTime: due.time,
    recurrenceType: task?.recurrenceType ?? "",
    estimatedTimeMinutes: task?.estimatedTimeMinutes ? String(task.estimatedTimeMinutes) : "",
    requiresPhotoProof: task?.requiresPhotoProof ?? false,
  };
}
