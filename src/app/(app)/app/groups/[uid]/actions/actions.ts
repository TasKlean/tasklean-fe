/**
 * The board's own presses: creating a task, saving one, and the layout, which
 * is a cookie and so can only be written from an action or a Route Handler.
 *
 * Neither write redirects. The panel's hrefs carry the board's filter and only
 * the form holds them, so it navigates back to the saved task itself; an
 * action redirecting would either lose the filter or take a path from the
 * request, which is an open redirect waiting to happen.
 */

"use server";

import { revalidatePath } from "next/cache";
import { actionFailureMessage } from "@/lib/api/action-failure/action-failure";
import { labelNameTakenMessage } from "@/lib/labels/refusals/refusals";
import { createTag } from "@/lib/labels/tags/tags";
import { completeTask, getTaskHistory } from "@/lib/tasks/completions/completions";
import { recordedLine } from "@/lib/tasks/completions/completions.helpers";
import type { RoundPageResult } from "@/lib/tasks/completions/completions.types";
import {
  completionRefusalMessage,
  taskFieldRefusal,
  taskRefusalMessage,
} from "@/lib/tasks/refusals/refusals";
import { createTask, deleteTask, updateTask } from "@/lib/tasks/tasks/tasks";
import { asBoardView, writeBoardView } from "@/lib/tasks/view/view";
import { taskWriteRequest } from "@/lib/tasks/write/write";
import { readTimeZone } from "@/lib/time/zone/zone-cookie";
import {
  parseCompleteTask,
  type CompleteTaskErrors,
} from "@/lib/validation/forms/complete-task.schema/complete-task.schema";
import { parseRoundPage } from "@/lib/validation/forms/round-page.schema/round-page.schema";
import { parseCreateTag } from "@/lib/validation/forms/tag.schema/tag.schema";
import {
  echoTask,
  parseCreateTaskTarget,
  parseEditTaskTarget,
  parseTask,
  type TaskErrors,
  type TaskValues,
} from "@/lib/validation/forms/task.schema/task.schema";

export type TaskPressState = {
  error: string | null;
};

export type CompleteTaskState = {
  error: string | null;
  // What to say once the round is in, which is where the task goes next.
  done: string | null;
  fieldErrors?: CompleteTaskErrors;
};

export type NewTagState = {
  // The name to attach, which is the stored one rather than what was typed.
  name: string | null;
  error: string | null;
};

export type TaskFormState = {
  error: string | null;
  // The task the write ended at, which is what the form navigates to.
  savedUid: string | null;
  fieldErrors?: TaskErrors;
  // Echoed so a submit without JavaScript keeps what was typed.
  values?: TaskValues;
};

/**
 * Remembers how the reader wants a board laid out.
 *
 * @param formData The pressed pill, whose submit button carries the view.
 * @returns Nothing: the pills render from the cookie, which the revalidation
 * below makes the next render read.
 */
export async function setBoardViewAction(formData: FormData): Promise<void> {
  const asked = formData.get("view");
  await writeBoardView(asBoardView(typeof asked === "string" ? asked : undefined));

  // Every board, not just this group's: the preference follows the reader, so
  // a cached render of another group would otherwise keep the old layout.
  revalidatePath("/app/groups", "layout");
}

/**
 * Reads the task a write posted.
 *
 * @returns The fields, or the state that reports what is wrong with them. Tags
 * are read with `getAll`: the name repeats, where `fromEntries` keeps the last.
 */
function askedTask(formData: FormData) {
  const tagNames = formData.getAll("tagNames").map(String);
  const asked = Object.fromEntries(formData);

  return {
    parsed: parseTask({ ...asked, tagNames }),
    values: echoTask(asked, tagNames),
  };
}

/** Re-renders the board, and the shell, which counts a group's tasks. */
function revalidateBoard(groupUid: string): void {
  revalidatePath(`/app/groups/${groupUid}`, "layout");
}

/**
 * Adds a task to a group.
 *
 * @param formData The form, carrying the group it belongs to.
 * @returns The new task's uid on success, so the panel can open it.
 */
export async function createTaskAction(
  _previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const asked = Object.fromEntries(formData);
  const target = parseCreateTaskTarget(asked);
  const { parsed, values } = askedTask(formData);

  if (!target.ok) return { error: "That group could not be found.", savedUid: null, values };
  if (!parsed.ok) {
    return { error: null, savedUid: null, fieldErrors: parsed.errors, values };
  }

  const { groupUid } = target.values;

  try {
    const timeZone = await readTimeZone();
    const task = await createTask({ groupUid, ...taskWriteRequest(parsed.values, timeZone) });

    revalidateBoard(groupUid);
    return { error: null, savedUid: task.uid ?? null };
  } catch (error) {
    const fieldErrors = taskFieldRefusal(error);

    if (fieldErrors) return { error: null, savedUid: null, fieldErrors, values };

    return { error: actionFailureMessage(error), savedUid: null, values };
  }
}

/**
 * Saves a task as it will then be.
 *
 * @param formData The form, carrying the task's own uid and its group's.
 * @returns The task's uid on success, so the panel returns to reading it.
 */
export async function updateTaskAction(
  _previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const target = parseEditTaskTarget(Object.fromEntries(formData));
  const { parsed, values } = askedTask(formData);

  if (!target.ok) return { error: "That task could not be found.", savedUid: null, values };
  if (!parsed.ok) {
    return { error: null, savedUid: null, fieldErrors: parsed.errors, values };
  }

  const { groupUid, taskUid } = target.values;

  try {
    const timeZone = await readTimeZone();
    await updateTask(taskUid, taskWriteRequest(parsed.values, timeZone));

    revalidateBoard(groupUid);
    return { error: null, savedUid: taskUid };
  } catch (error) {
    const fieldErrors = taskFieldRefusal(error);

    if (fieldErrors) return { error: null, savedUid: null, fieldErrors, values };

    return {
      error: taskRefusalMessage(error) ?? actionFailureMessage(error),
      savedUid: null,
      values,
    };
  }
}

/**
 * Deletes one task for good.
 *
 * @returns The refusal to show in the footer, or null once it is gone, which
 * is the panel's cue to close.
 */
export async function deleteTaskAction(groupUid: string, taskUid: string): Promise<TaskPressState> {
  const target = parseEditTaskTarget({ groupUid, taskUid });

  if (!target.ok) return { error: "That task could not be found." };

  try {
    await deleteTask(target.values.taskUid);
  } catch (error) {
    return { error: taskRefusalMessage(error) ?? actionFailureMessage(error) };
  }

  revalidateBoard(target.values.groupUid);
  return { error: null };
}

/**
 * Records a round of a task as done.
 *
 * @param formData The task and its group, and what the round took: minutes,
 * a note and proof, each of which the simple press leaves out entirely.
 * @returns The line naming what happened, or the refusal to show in its place.
 */
export async function completeTaskAction(
  _previous: CompleteTaskState,
  formData: FormData,
): Promise<CompleteTaskState> {
  const asked = Object.fromEntries(formData);
  const target = parseEditTaskTarget(asked);

  if (!target.ok) return { error: "That task could not be found.", done: null };

  const parsed = parseCompleteTask(asked);

  if (!parsed.ok) return { error: null, done: null, fieldErrors: parsed.errors };

  const { groupUid, taskUid } = target.values;

  try {
    const recorded = await completeTask(taskUid, parsed.values);
    const timeZone = await readTimeZone();

    revalidateBoard(groupUid);
    return { error: null, done: recordedLine(recorded, new Date(), timeZone) };
  } catch (error) {
    return { error: completionRefusalMessage(error) ?? actionFailureMessage(error), done: null };
  }
}

/**
 * Loads the page of a task's history that follows a cursor.
 *
 * @param taskUid The task, bound on the server rather than posted, so a press
 * can only ever ask for the history of the task it sits in.
 * @param fields The cursor the last page handed back.
 * @returns The page, or the line to show above the press. A refusal is an
 * answer rather than a throw: the list holding the pages has a failure slot
 * and revalidating would throw away what is on screen.
 */
export async function loadRoundPageAction(
  taskUid: string,
  fields: unknown,
): Promise<RoundPageResult> {
  const asked = typeof fields === "object" && fields !== null ? fields : {};
  const parsed = parseRoundPage({ ...asked, taskUid });

  if (!parsed.ok) {
    return { ok: false, message: parsed.errors.cursor ?? "That page cannot be loaded." };
  }

  try {
    return { ok: true, page: await getTaskHistory(parsed.values.taskUid, parsed.values.cursor) };
  } catch (error) {
    return { ok: false, message: actionFailureMessage(error) };
  }
}

/**
 * Adds a tag to the household so a task can carry it in the colour it was
 * given, a task's own save posting names alone.
 *
 * @returns The name to attach. A name the household already holds comes back
 * as itself rather than as a failure: the reader asked for that tag, and only
 * a live one can answer a create that way.
 */
export async function createTaskTagAction(
  groupUid: string,
  name: string,
  color: string,
): Promise<NewTagState> {
  const parsed = parseCreateTag({ groupUid, name, color });

  if (!parsed.ok) return { name: null, error: parsed.errors.name ?? "That tag cannot be added." };

  try {
    const tag = await createTag(parsed.values);
    return { name: tag.name ?? parsed.values.name, error: null };
  } catch (error) {
    if (labelNameTakenMessage(error)) return { name: parsed.values.name, error: null };

    return { name: null, error: actionFailureMessage(error) };
  }
}
