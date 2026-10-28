/**
 * Which credential a 401 was about, for the endpoints that check one from the
 * request body. Only an envelope code names a field: those endpoints answer 401
 * for a dead session too, carrying none, and blaming an input would hide it.
 */

import { PASSWORD_INVALID, TWO_FACTOR_CODE_INVALID } from "@/lib/api/error-codes";
import { isApiError } from "@/lib/api/errors";

export type RefusedCredential = {
  field: "password" | "code";
  message: string;
};

/**
 * Reads which credential the backend refused.
 *
 * @returns The field and the message to show against it, or null when the
 * failure was not a refused credential.
 */
export function refusedCredential(error: unknown): RefusedCredential | null {
  if (!isApiError(error) || error.status !== 401) return null;
  if (error.code === PASSWORD_INVALID) return { field: "password", message: error.message };
  if (error.code === TWO_FACTOR_CODE_INVALID) return { field: "code", message: error.message };
  return null;
}
