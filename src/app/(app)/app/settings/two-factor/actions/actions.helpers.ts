/**
 * What the section's actions read a throw through: which field a 401 belongs
 * to, and what a 409 means for the page the action was called from.
 */

import { revalidatePath } from "next/cache";
import type { ConfirmState } from "@/app/(app)/app/settings/two-factor/actions/actions.types";
import { PASSWORD_INVALID } from "@/lib/api/error-codes";
import { isApiError } from "@/lib/api/errors";

const PATH = "/app/settings/two-factor";

/**
 * Routes a refused credential to the field it is about.
 *
 * Both credentials answer 401, so the envelope's code is the only thing that
 * tells them apart. Anything else lands on the code, which is the field every
 * one of these forms has.
 *
 * @returns The state to show, or null when this failure was something else.
 */
export function credentialFailure(error: unknown): ConfirmState | null {
  if (!isApiError(error) || error.status !== 401) return null;

  const field = error.code === PASSWORD_INVALID ? "password" : "code";
  return { error: null, fieldErrors: { [field]: error.message } };
}

/**
 * Marks the rendered page stale, for a failure that means it was.
 *
 * A 409 is the backend disagreeing about the state this screen was drawn from,
 * so the next read is the only thing that settles it.
 */
export function refreshOnConflict(error: unknown): void {
  if (isApiError(error) && error.status === 409) revalidatePath(PATH);
}
