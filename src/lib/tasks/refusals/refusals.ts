/**
 * The two refusals a chore's own presses answer with, neither carrying a code.
 * A 403 is the task not being the caller's to change, which is a narrower thing
 * than the group 403 `groups/unavailable` reads, and a 404 is a chore somebody
 * else removed while this page was open.
 *
 * Only called where those statuses can mean this: a read of the board bounces
 * on a group 403 long before either gets here.
 */

import { isApiError } from "@/lib/api/errors";

// Said rather than echoed. Spring's own line for a denied expression is a
// constant that names nothing about chores.
const NOT_YOURS = "This chore is not yours to change. Its author or an admin can.";

// A chore that is gone is gone for everybody, so the page it was pressed on is
// already showing something that no longer exists.
const GONE = "That chore has been removed. Refresh to see what is left.";

/**
 * Phrases a press refused because the chore belongs to somebody else.
 *
 * @returns The message, or null when the failure was something else, so a
 * caller falls back to `actionFailureMessage`.
 */
export function taskNotYoursMessage(error: unknown): string | null {
  if (!isApiError(error) || error.status !== 403) return null;

  return NOT_YOURS;
}

/**
 * Phrases a press on a chore that is no longer there.
 *
 * @returns The message, or null when the failure was something else.
 */
export function taskGoneMessage(error: unknown): string | null {
  if (!isApiError(error) || error.status !== 404) return null;

  return GONE;
}

/**
 * Phrases whichever of the two a press ran into.
 *
 * @returns The message, or null for anything else.
 */
export function taskRefusalMessage(error: unknown): string | null {
  return taskNotYoursMessage(error) ?? taskGoneMessage(error);
}
