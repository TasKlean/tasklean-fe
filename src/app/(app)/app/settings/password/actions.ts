/**
 * The password section's Server Actions. Both hand back a fresh token pair that
 * has to replace the one in the cookie, because the backend revokes every
 * session the account held before issuing it.
 */

"use server";

import { revalidatePath } from "next/cache";
import { changePassword, setPassword } from "@/lib/account/account";
import { actionFailureMessage } from "@/lib/api/action-failure";
import { PASSWORD_INVALID } from "@/lib/api/error-codes";
import { isApiError } from "@/lib/api/errors";
import { startSession } from "@/lib/auth/start-session";
import { parseChangePassword } from "@/lib/validation/forms/change-password.schema";
import { parseSetPassword } from "@/lib/validation/forms/set-password.schema";

export type PasswordActionState = {
  error: string | null;
  fieldErrors?: Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;
  // The visible success state, since the page it returns to looks unchanged.
  done?: boolean;
};

const PASSWORD_PATH = "/app/settings/password";

/**
 * Changes the password and reseals the session with the pair that comes back.
 *
 * Only the code says the password was the problem: this endpoint checks a
 * credential, so its 401 can still be the session, and a field error would
 * hide that.
 */
export async function changePasswordAction(
  _previous: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const parsed = parseChangePassword(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors };

  const { currentPassword, newPassword } = parsed.values;

  try {
    const tokens = await changePassword(currentPassword, newPassword);
    await startSession(tokens);
  } catch (error) {
    if (isApiError(error) && error.code === PASSWORD_INVALID) {
      return { error: null, fieldErrors: { currentPassword: error.message } };
    }
    return { error: actionFailureMessage(error) };
  }

  revalidatePath(PASSWORD_PATH);
  return { error: null, done: true };
}

/** Sets the first password on an account that has only ever used Google. */
export async function setPasswordAction(
  _previous: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const parsed = parseSetPassword(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors };

  try {
    const tokens = await setPassword(parsed.values.newPassword);
    await startSession(tokens);
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  revalidatePath(PASSWORD_PATH);
  return { error: null, done: true };
}
