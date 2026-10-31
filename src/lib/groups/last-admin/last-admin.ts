/**
 * The 409 a role change, a removal and a leave all share: a group must keep at
 * least one admin. None of these routes carries a machine-readable code, so the
 * status plus the route is the whole signal, and the fix is ours to say.
 *
 * Not for join, whose own 409 means the caller is already a member.
 */

import { isApiError } from "@/lib/api/errors";

/** What the backend says when it sends no message of its own. */
const REFUSAL = "A group must have at least one admin.";

const NEXT_STEP = "Make someone else an admin first.";

/**
 * Ends a sentence that has to be followed by another.
 *
 * The backend's own copy for this one arrives without a full stop, so joining
 * the two without this reads as a single run-on line.
 */
function sentence(message: string): string {
  const text = message.trim();
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * Composes a last-admin refusal into what happened and what to do about it.
 *
 * @returns The message, or null when the failure was something else, so a
 * caller can fall back to `actionFailureMessage`.
 */
export function lastAdminMessage(error: unknown): string | null {
  if (!isApiError(error) || error.status !== 409) return null;

  return `${sentence(error.message || REFUSAL)} ${NEXT_STEP}`;
}
