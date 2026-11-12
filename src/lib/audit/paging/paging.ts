/**
 * What a Load more press answers with when it cannot answer with a page. Both
 * trails read it, so the line a refused cursor shows is written once.
 */

import { actionFailureMessage } from "@/lib/api/action-failure/action-failure";
import { isApiError } from "@/lib/api/errors";

// Read here alone, so it stays here rather than in api/error-codes.
const PAGE_CURSOR_INVALID = "PAGE_CURSOR_INVALID";

// Never retried from the first page: a cursor is ours to hand back unchanged,
// so a refused one is our own bug, and a silent restart would re-show rows the
// reader already has while losing where they were.
const DEAD_CURSOR = "We could not load more activity. Reload the page to start again.";

/**
 * Turns a failed page read into the line above the button.
 *
 * @param error Whatever the read threw.
 * @returns The line, which for a cursor the backend will not take says to
 * reload rather than offering a retry that would start again from the top.
 */
export function pageFailureMessage(error: unknown): string {
  if (isApiError(error) && error.code === PAGE_CURSOR_INVALID) return DEAD_CURSOR;

  return actionFailureMessage(error);
}
