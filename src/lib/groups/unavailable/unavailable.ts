/**
 * What a group screen does when the backend will not show it. The membership
 * check answers false for a group that is not the caller's and for a uid that
 * does not exist alike, and the framework turns that into a 403 before any
 * service code runs, so the two cannot be told apart. That is deliberate: the
 * alternative lets someone probe for real uids.
 */

import { isApiError } from "@/lib/api/errors";
import { SIGNED_IN_HOME } from "@/lib/auth/safe-next/safe-next";

/** The notice the group list shows after a bounce, as a query parameter. */
export const UNAVAILABLE_PARAM = "unavailable";

/** Where a group nobody may see sends its reader. */
export const GROUP_UNAVAILABLE_PATH = `${SIGNED_IN_HOME}?${UNAVAILABLE_PARAM}=1`;

/**
 * Reports whether a failed group call means the group is not available.
 *
 * @returns True for 403 and 404 alike. A 404 reaches here when a group or a
 * membership is genuinely gone, and the reader needs the same thing either
 * way: the list, refreshed.
 */
export function isGroupUnavailable(error: unknown): boolean {
  return isApiError(error) && (error.status === 403 || error.status === 404);
}
