/**
 * What a task is created and saved with. One schema for both, because `PUT
 * /api/tasks/{uid}` takes the task as it will then be: a field left out is
 * cleared, so an edit posts every field a create does.
 *
 * The due date is two fields here and one on the wire. A date with no time
 * means the end of that day, which is what makes a task due "Tuesday" read
 * as overdue on Wednesday rather than at Tuesday midnight.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  dayRule,
  flagRule,
  optionalLabelIdRule,
  optionalTextRule,
  optionalUidRule,
  recurrenceRule,
  tagNamesRule,
  taskDescriptionRule,
  taskMinutesRule,
  taskNameRule,
  taskPriorityRule,
  timeOfDayRule,
  uidRule,
} from "@/lib/validation/rules/rules";

// The backend refuses this pair with a 400 carrying no code, so it is settled
// here: a recurrence is the schedule's anchor and has nothing to count from.
const NEEDS_DUE_DATE = "A task that repeats needs a date to repeat from.";

export const taskSchema = z
  .object({
    name: taskNameRule,
    description: taskDescriptionRule,
    priority: taskPriorityRule,
    categoryId: optionalLabelIdRule,
    tagNames: tagNamesRule,
    assignedToUid: optionalUidRule,
    defaultAssigneeUid: optionalUidRule,
    dueDate: dayRule,
    dueTime: timeOfDayRule,
    recurrenceType: recurrenceRule,
    estimatedTimeMinutes: taskMinutesRule,
    requiresPhotoProof: flagRule,
    photoUid: optionalUidRule,
  })
  .check(
    z.refine((fields) => fields.recurrenceType === undefined || fields.dueDate !== undefined, {
      error: NEEDS_DUE_DATE,
      path: ["dueDate"],
    }),
  );

// Lenient, so even a rejected submission echoes back into the fields.
const taskEchoSchema = z.object({
  name: optionalTextRule,
  description: optionalTextRule,
  priority: optionalTextRule,
  categoryId: optionalTextRule,
  assignedToUid: optionalTextRule,
  defaultAssigneeUid: optionalTextRule,
  dueDate: optionalTextRule,
  dueTime: optionalTextRule,
  recurrenceType: optionalTextRule,
  estimatedTimeMinutes: optionalTextRule,
  requiresPhotoProof: optionalTextRule,
});

// What a write was about, which is never in the fields a reader fills: an
// action never sees the route's params, and it has to re-render the board the
// press was made on.
export const createTaskTargetSchema = z.object({
  groupUid: uidRule("Pick a group."),
});

export const editTaskTargetSchema = z.object({
  groupUid: uidRule("Pick a group."),
  taskUid: uidRule("Pick a task."),
});

export type TaskFields = z.infer<typeof taskSchema>;

export type CreateTaskTarget = z.infer<typeof createTaskTargetSchema>;

export type EditTaskTarget = z.infer<typeof editTaskTargetSchema>;

export type TaskErrors = Partial<Record<keyof TaskFields, string>>;

// What the form holds, which is every field as the reader typed it. The picture
// is not among them: it is a hidden uid the form rebuilds from what is staged.
export type TaskValues = {
  name: string;
  description: string;
  priority: string;
  categoryId: string;
  tagNames: string[];
  assignedToUid: string;
  defaultAssigneeUid: string;
  dueDate: string;
  dueTime: string;
  recurrenceType: string;
  estimatedTimeMinutes: string;
  requiresPhotoProof: boolean;
};

/** Parses the task a write was asked for. */
export function parseTask(input: unknown): Parsed<TaskFields> {
  return parseWith(taskSchema, input);
}

/** Parses the group a task was added to. */
export function parseCreateTaskTarget(input: unknown): Parsed<CreateTaskTarget> {
  return parseWith(createTaskTargetSchema, input);
}

/** Parses the task a save was pressed for, and the group it is on. */
export function parseEditTaskTarget(input: unknown): Parsed<EditTaskTarget> {
  return parseWith(editTaskTargetSchema, input);
}

/** Pulls a rejected task back out, so a submit without JS loses nothing. */
export function echoTask(input: unknown, tagNames: string[]): TaskValues {
  const result = z.safeParse(taskEchoSchema, input);
  const echoed = result.success ? result.data : {};

  return {
    name: echoed.name ?? "",
    description: echoed.description ?? "",
    priority: echoed.priority ?? "",
    categoryId: echoed.categoryId ?? "",
    tagNames,
    assignedToUid: echoed.assignedToUid ?? "",
    defaultAssigneeUid: echoed.defaultAssigneeUid ?? "",
    dueDate: echoed.dueDate ?? "",
    dueTime: echoed.dueTime ?? "",
    recurrenceType: echoed.recurrenceType ?? "",
    estimatedTimeMinutes: echoed.estimatedTimeMinutes ?? "",
    // A tickbox posts a value only when it is on, so its absence is the answer.
    requiresPhotoProof: Boolean(echoed.requiresPhotoProof),
  };
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateTask(values: TaskValues): TaskErrors {
  const result = parseTask(values);
  return result.ok ? {} : result.errors;
}
