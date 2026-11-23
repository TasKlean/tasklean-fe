/**
 * The board's own presses: creating a chore, saving one, and the layout, which
 * is a cookie and so can only be written from an action or a Route Handler.
 *
 * Neither write redirects. The panel's hrefs carry the board's filter and only
 * the form holds them, so it navigates back to the saved chore itself; an
 * action redirecting would either lose the filter or take a path from the
 * request, which is an open redirect waiting to happen.
 */

"use server";

import { revalidatePath } from "next/cache";
import { actionFailureMessage } from "@/lib/api/action-failure/action-failure";
import { labelNameTakenMessage } from "@/lib/labels/refusals/refusals";
import { createTag } from "@/lib/labels/tags/tags";
import { taskRefusalMessage } from "@/lib/tasks/refusals/refusals";
import { createTask, deleteTask, updateTask } from "@/lib/tasks/tasks/tasks";
import { asBoardView, writeBoardView } from "@/lib/tasks/view/view";
import { taskWriteRequest } from "@/lib/tasks/write/write";
import { readTimeZone } from "@/lib/time/zone/zone-cookie";
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

export type NewTagState = {
  // The name to attach, which is the stored one rather than what was typed.
  name: string | null;
  error: string | null;
};

export type TaskFormState = {
  error: string | null;
  // The chore the write ended at, which is what the form navigates to.
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
 * Reads the chore a write posted.
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

/** Re-renders the board, and the shell, which counts a group's chores. */
function revalidateBoard(groupUid: string): void {
  revalidatePath(`/app/groups/${groupUid}`, "layout");
}

/**
 * Adds a chore to a group.
 *
 * @param formData The form, carrying the group it belongs to.
 * @returns The new chore's uid on success, so the panel can open it.
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
    return { error: actionFailureMessage(error), savedUid: null, values };
  }
}

/**
 * Saves a chore as it will then be.
 *
 * @param formData The form, carrying the chore's own uid and its group's.
 * @returns The chore's uid on success, so the panel returns to reading it.
 */
export async function updateTaskAction(
  _previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const target = parseEditTaskTarget(Object.fromEntries(formData));
  const { parsed, values } = askedTask(formData);

  if (!target.ok) return { error: "That chore could not be found.", savedUid: null, values };
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
    return {
      error: taskRefusalMessage(error) ?? actionFailureMessage(error),
      savedUid: null,
      values,
    };
  }
}

/**
 * Deletes one chore for good.
 *
 * @returns The refusal to show in the footer, or null once it is gone, which
 * is the panel's cue to close.
 */
export async function deleteTaskAction(groupUid: string, taskUid: string): Promise<TaskPressState> {
  const target = parseEditTaskTarget({ groupUid, taskUid });

  if (!target.ok) return { error: "That chore could not be found." };

  try {
    await deleteTask(target.values.taskUid);
  } catch (error) {
    return { error: taskRefusalMessage(error) ?? actionFailureMessage(error) };
  }

  revalidateBoard(target.values.groupUid);
  return { error: null };
}

/**
 * Adds a tag to the household so a chore can carry it in the colour it was
 * given, a chore's own save posting names alone.
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
