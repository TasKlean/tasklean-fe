/**
 * The reset-password Server Action. The backend revokes every refresh token the
 * user holds, so this clears our own cookie before sending them to log in: the
 * session it sealed cannot survive the reset either way.
 */

"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase/retry-phrase";
import { clearSession } from "@/lib/auth/session/session";
import { completePasswordReset } from "@/lib/auth/password-reset/password-reset";
import { parseResetPassword } from "@/lib/validation/forms/reset-password.schema/reset-password.schema";

export type ResetPasswordState = {
  error: string | null;
  fieldErrors?: { password?: string; confirmPassword?: string };
};

const GENERIC_FAILURE = "Something went wrong setting your password. Please try again.";

/**
 * Sets the new password and sends the user to log in with it.
 *
 * @returns The errors to display, or nothing because it redirected on success.
 */
export async function resetPasswordAction(
  _previous: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = parseResetPassword(Object.fromEntries(formData));
  if (!parsed.ok) {
    const { token, ...fieldErrors } = parsed.errors;
    // The token is a hidden field, so its problem is the page's, not a field's.
    return { error: token ?? null, fieldErrors };
  }

  const { token, password } = parsed.values;

  try {
    await completePasswordReset(token, password);
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 429) {
        return { error: rateLimitMessage(error) };
      }
      // Our policy mirrors the backend's, so a 400 here means the two have
      // drifted: show what it objected to against the field.
      if (error.status === 400) {
        return { error: null, fieldErrors: { password: error.message } };
      }
      return { error: error.message || GENERIC_FAILURE };
    }
    return { error: GENERIC_FAILURE };
  }

  await clearSession();

  // Outside the try: redirect() signals by throwing.
  redirect("/login?reset=1");
}
