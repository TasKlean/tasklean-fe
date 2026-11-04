/**
 * Turns a 429 into something to show. The reason is ours rather than the
 * backend's: that one is a single constant saying "try again later", which read
 * twice over once the window was added. Never auto-retry on the strength of it.
 */

import type { ApiError } from "@/lib/api/errors";

const TOO_MANY = "Too many attempts.";

/** Phrases a `Retry-After` count of seconds, which may not have been sent. */
function retryPhrase(seconds: number | null): string {
  if (!seconds || seconds < 60) return "Please try again shortly.";
  const minutes = Math.ceil(seconds / 60);
  return `Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

/** Composes a rate limit and the window it carried into one message. */
export function rateLimitMessage(error: ApiError): string {
  return `${TOO_MANY} ${retryPhrase(error.retryAfterSeconds)}`;
}
