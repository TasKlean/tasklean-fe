/**
 * The one way a Server Action turns a thrown call into something the screen can
 * show. Shared so a rate limit reads the same everywhere and a dead session is
 * never reported as a failure the reader could retry.
 */

import "server-only";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase";
import { isSessionExpiredError } from "@/lib/api/server";

/** What a failure with nothing usable in it says. */
export const GENERIC_FAILURE = "Something went wrong. Please try again.";

/**
 * Turns a failed call into a message.
 *
 * @returns The message to display. A dead session never returns: it redirects
 * to `/login`, since nothing on the page works without one.
 */
export function actionFailureMessage(error: unknown): string {
  if (isSessionExpiredError(error)) redirect("/login");
  if (!isApiError(error)) return GENERIC_FAILURE;

  const message = error.status === 429 ? rateLimitMessage(error) : error.message;
  return message || GENERIC_FAILURE;
}
