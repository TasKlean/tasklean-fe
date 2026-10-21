/**
 * The deactivation Server Action. The backend revokes every session the account
 * holds, so this clears our own cookie: the session it sealed cannot outlive a
 * deactivated account either way.
 */

"use server";

import { redirect } from "next/navigation";
import { deactivateAccount } from "@/lib/account/account";
import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure";
import { PASSWORD_INVALID } from "@/lib/api/error-codes";
import { isApiError } from "@/lib/api/errors";
import { clearSession } from "@/lib/auth/session";
import { parseDeactivateAccount } from "@/lib/validation/forms/deactivate-account.schema";

export type DeactivateState = {
  error: string | null;
  fieldErrors?: Partial<Record<"password", string>>;
};

/**
 * Deactivates the account and sends them to the sign-in screen.
 *
 * A refused password is shown against that field rather than as a banner, so
 * the one thing to fix is where the typing happened.
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
    if (isApiError(error) && error.code === PASSWORD_INVALID) {
      return { error: null, fieldErrors: { password: error.message } };
    }
    return { error: actionFailureMessage(error) };
  }

  await clearSession();

  // Outside the try: redirect() signals by throwing.
  redirect("/login?deactivated=1");
}
