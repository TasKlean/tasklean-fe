/**
 * The deactivation Server Action. The backend revokes every session the account
 * holds, so this clears our own cookie: the session it sealed cannot outlive a
 * deactivated account either way.
 */

"use server";

import { redirect } from "next/navigation";
import { deactivateAccount } from "@/lib/account/account";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase";
import { isSessionExpiredError } from "@/lib/api/server";
import { clearSession } from "@/lib/auth/session";
import { parseDeactivateAccount } from "@/lib/validation/forms/deactivate-account.schema";

export type DeactivateState = {
  error: string | null;
};

const GENERIC_FAILURE = "Something went wrong. Please try again.";

/**
 * Deactivates the account and sends them to the sign-in screen.
 *
 * @returns The error to display, or nothing because it redirected on success.
 */
export async function deactivateAccountAction(
  _previous: DeactivateState,
  formData: FormData,
): Promise<DeactivateState> {
  const parsed = parseDeactivateAccount(Object.fromEntries(formData));
  if (!parsed.ok) return { error: GENERIC_FAILURE };

  try {
    // Empty means a Google-only account, which the session alone confirms.
    await deactivateAccount(parsed.values.password || undefined);
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    if (!isApiError(error)) return { error: GENERIC_FAILURE };

    const message = error.status === 429 ? rateLimitMessage(error) : error.message;
    return { error: message || GENERIC_FAILURE };
  }

  await clearSession();

  // Outside the try: redirect() signals by throwing.
  redirect("/login?deactivated=1");
}
