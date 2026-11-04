/**
 * The one way a Server Action turns a thrown call into something the screen can
 * show. Shared so a rate limit reads the same everywhere and a dead session is
 * never reported as a failure the reader could retry.
 */

import "server-only";

import { redirect } from "next/navigation";
import { GENERIC_FAILURE, isApiError, isApiUnreachableError, UNREACHABLE } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase/retry-phrase";
import { isSessionExpiredError } from "@/lib/api/server/server";

/**
 * Picks the line for a throw a caller has no handling of its own for.
 *
 * @returns The unreachable line, or the caller's own wording. An outage is
 * worth naming, since "try again" is the wrong advice while nothing answers.
 */
export function unreachableOr(error: unknown, fallback: string): string {
  return isApiUnreachableError(error) ? UNREACHABLE : fallback;
}

/**
 * Turns a failed call into a message.
 *
 * @returns The message to display. A dead session never returns: it redirects
 * to `/login`, since nothing on the page works without one.
 */
export function actionFailureMessage(error: unknown): string {
  if (isSessionExpiredError(error)) redirect("/login");
  if (isApiUnreachableError(error)) return UNREACHABLE;
  if (!isApiError(error)) return GENERIC_FAILURE;

  const message = error.status === 429 ? rateLimitMessage(error) : error.message;
  return message || GENERIC_FAILURE;
}
