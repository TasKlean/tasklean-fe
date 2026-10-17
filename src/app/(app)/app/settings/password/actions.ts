/**
 * The password section's Server Actions. Both hand back a fresh token pair that
 * has to replace the one in the cookie, because the backend revokes every
 * session the account held before issuing it.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { changePassword, setPassword } from "@/lib/account/account";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase";
import { isSessionExpiredError } from "@/lib/api/server";
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

const GENERIC_FAILURE = "Something went wrong. Please try again.";

/**
 * Turns a failed call into a message the card can show.
 *
 * @returns The state to hand back. A dead session never returns: it redirects,
 * since nothing on the page works without one.
 */
function failed(error: unknown): PasswordActionState {
  if (isSessionExpiredError(error)) redirect("/login");
  if (!isApiError(error)) return { error: GENERIC_FAILURE };

  const message = error.status === 429 ? rateLimitMessage(error) : error.message;
  return { error: message || GENERIC_FAILURE };
}

/**
 * Changes the password and reseals the session with the pair that comes back.
 *
 * The 401 here is the current password being wrong, not the session dying, so
 * it is shown against that field.
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
    if (isApiError(error) && error.status === 401) {
      return { error: null, fieldErrors: { currentPassword: error.message } };
    }
    return failed(error);
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
    return failed(error);
  }

  revalidatePath(PASSWORD_PATH);
  return { error: null, done: true };
}
