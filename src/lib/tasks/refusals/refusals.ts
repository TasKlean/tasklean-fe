/**
 * The refusals a task's own presses answer with. The two writes answer with
 * neither a code nor a line of their own; recording a round answers with both.
 * A 403 is the task not being the caller's to change, which is a narrower thing
 * than the group 403 `groups/unavailable` reads, and a 404 is a task somebody
 * else removed while this page was open.
 *
 * Only called where those statuses can mean this: a read of the board bounces
 * on a group 403 long before either gets here.
 */

import { isApiError } from "@/lib/api/errors";
import type { TaskErrors } from "@/lib/validation/forms/task.schema/task.schema";

// Recording a round, and a due date in the past, are the task refusals that
// carry a code, so they are read rather than guessed at from the status.
const ROUND_NOT_DUE = "TASK_ROUND_NOT_DUE";
const ALREADY_AHEAD = "TASK_ROUND_ALREADY_AHEAD";
const ALREADY_RECORDED = "TASK_INSTANCE_ALREADY_RECORDED";
const PROOF_REQUIRED = "TASK_PHOTO_PROOF_REQUIRED";
const ARCHIVED = "TASK_ARCHIVED";
const DUE_DATE_PAST = "TASK_DUE_DATE_PAST";

// Said rather than echoed. Spring's own line for a denied expression is a
// constant that names nothing about tasks.
const NOT_YOURS = "This task is not yours to change. Its author or an admin can.";

// A task that is gone is gone for everybody, so the page it was pressed on is
// already showing something that no longer exists.
const GONE = "That task has been removed. Refresh to see what is left.";

// Said rather than echoed: a uid that resolves to nobody means they have left
// the household or were never in it, which the backend's own line does not say.
const GONE_MEMBER = "That member is not in this group any more.";

const PAST_DUE_DATE = "A due date cannot be in the past.";

// The task and both member pickers all answer 404 carrying no code, so the
// backend's own constants are the only thing telling them apart.
const MEMBER_FIELDS: Record<string, keyof TaskErrors> = {
  "Assigned member not found": "assignedToUid",
  "Default assignee not found": "defaultAssigneeUid",
};

/**
 * Phrases a press refused because the task belongs to somebody else.
 *
 * @returns The message, or null when the failure was something else, so a
 * caller falls back to `actionFailureMessage`.
 */
export function taskNotYoursMessage(error: unknown): string | null {
  if (!isApiError(error) || error.status !== 403) return null;

  return NOT_YOURS;
}

/**
 * Reads a refusal a write can blame on one field of the form.
 *
 * @returns The complaint against the field it is about, or null for anything
 * else, including the 404 that is the task itself. The member pickers answer
 * 404 with no code, so they are told apart by the backend's own message, where
 * a past due date carries one.
 */
export function taskFieldRefusal(error: unknown): TaskErrors | null {
  if (!isApiError(error)) return null;

  if (error.code === DUE_DATE_PAST) return { dueDate: PAST_DUE_DATE };

  if (error.status !== 404) return null;

  const field = MEMBER_FIELDS[error.message ?? ""];

  return field ? { [field]: GONE_MEMBER } : null;
}

/**
 * Phrases a press on a task that is no longer there.
 *
 * @returns The message, or null when the failure was something else, a member
 * picker's own 404 included: that one is about the field, not the task.
 */
export function taskGoneMessage(error: unknown): string | null {
  if (!isApiError(error) || error.status !== 404) return null;

  return taskFieldRefusal(error) ? null : GONE;
}

/**
 * Phrases whichever of the two a press ran into.
 *
 * @returns The message, or null for anything else.
 */
export function taskRefusalMessage(error: unknown): string | null {
  return taskNotYoursMessage(error) ?? taskGoneMessage(error);
}

/**
 * Phrases a round the backend would not record.
 *
 * @returns The message, or null when the failure was something else. A 403
 * here is the task being somebody else's to do rather than to change, which
 * is why this does not fall back to `taskNotYoursMessage`.
 */
export function completionRefusalMessage(error: unknown): string | null {
  if (!isApiError(error)) return null;

  if (error.status === 403) return "This task is assigned to somebody else.";

  if (error.status === 409) {
    switch (error.code) {
      // Doing one early is allowed, so this is only ever a skip: the endpoint
      // refuses a round nobody could have missed yet.
      case ROUND_NOT_DUE:
        return "Not due yet. You can record this on the day it is due.";
      case ALREADY_AHEAD:
        return "This task has already been done ahead of schedule. The next round can be recorded once this one is over.";
      case ALREADY_RECORDED:
        return "This round is already recorded. Refresh to see where the task is now.";
      case PROOF_REQUIRED:
        return "This task needs a photo to be marked done.";
      case ARCHIVED:
        return "This task is archived, so nothing can be recorded against it.";
      default:
        return null;
    }
  }

  return taskGoneMessage(error);
}
