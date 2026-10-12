/**
 * Turns a 429 into something to show. The backend sends the reason as prose and
 * the window as a `Retry-After` header, so the two are only one sentence once
 * put back together here. Never auto-retry on the strength of it.
 */

import type { ApiError } from "@/lib/api/errors";

const TOO_MANY = "Too many attempts.";

/** Phrases a `Retry-After` count of seconds, which may not have been sent. */
function retryPhrase(seconds: number | null): string {
  if (!seconds || seconds < 60) return "Please try again shortly.";
  const minutes = Math.ceil(seconds / 60);
  return `Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

/** Composes a rate-limited failure and its window into one message. */
export function rateLimitMessage(error: ApiError): string {
  return `${error.message || TOO_MANY} ${retryPhrase(error.retryAfterSeconds)}`;
}
