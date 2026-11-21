/**
 * The two 409s the label endpoints answer with, neither carrying a code: a name
 * already taken, and a category tasks are still filed under. Status plus the
 * call that was made is the whole signal, so each reader is called only where
 * that call could produce it.
 */

import { isApiError } from "@/lib/api/errors";

// Said rather than echoed, because the backend's own line names the table:
// "Tag with this name already exists in the group".
//
// One sentence, and no word about reviving a deleted label. On a create this
// can only be a live one, since a deleted name is revived rather than refused;
// on a rename it may be either, and a rename never revives.
const NAME_TAKEN = "That name is already taken.";

// Only ever the fallback: the backend's own message carries the count of tasks,
// which nothing here can work out.
const IN_USE = "That category is still used by some tasks.";

/**
 * Ends a sentence that has to be followed by another.
 *
 * The backend's own copy arrives without a full stop, so joining the two
 * without this reads as a single run-on line.
 */
function sentence(message: string): string {
  const text = message.trim();
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * Phrases the refusal of a name another label in the household holds.
 *
 * Only for a create or a rename, where that is the one thing a 409 can mean.
 *
 * @returns The message, or null when the failure was something else, so a
 * caller can fall back to `actionFailureMessage`.
 */
export function labelNameTakenMessage(error: unknown): string | null {
  if (!isApiError(error) || error.status !== 409) return null;

  return NAME_TAKEN;
}

/**
 * Phrases the refusal to delete a category tasks are still filed under.
 *
 * The backend's message is preferred here rather than ours, because it is the
 * only place the number of tasks in the way arrives.
 *
 * @returns The message, or null when the failure was something else.
 */
export function categoryInUseMessage(error: unknown): string | null {
  if (!isApiError(error) || error.status !== 409) return null;

  return sentence(error.message || IN_USE);
}
