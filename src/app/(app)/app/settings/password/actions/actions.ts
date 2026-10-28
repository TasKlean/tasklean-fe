/**
 * The password section's Server Actions. Both hand back a fresh token pair that
 * has to replace the one in the cookie, because the backend revokes every
 * session the account held before issuing it.
 */

"use server";

import { revalidatePath } from "next/cache";
import { changePassword, setPassword } from "@/lib/account/account";
import { actionFailureMessage } from "@/lib/api/action-failure/action-failure";
import { refusedCredential } from "@/lib/api/credential-field/credential-field";
import { startSession } from "@/lib/auth/start-session/start-session";
import { parseChangePassword } from "@/lib/validation/forms/change-password.schema/change-password.schema";
import { parseSetPassword } from "@/lib/validation/forms/set-password.schema/set-password.schema";

export type PasswordActionState = {
  error: string | null;
  fieldErrors?: Partial<
    Record<"currentPassword" | "newPassword" | "confirmPassword" | "code", string>
  >;
  // Which of the two happened, not just that one did: the page's own
  // `passwordSet` flips as this returns, so the notice cannot read that.
  done?: "changed" | "set";
};

const PASSWORD_PATH = "/app/settings/password";

/**
 * Changes the password and reseals the session with the pair that comes back.
 *
 * Only the envelope's code says which credential was the problem: this endpoint
 * checks two, and its 401 can still be the session, so a 401 carrying no code
 * stays a banner.
 */
export async function changePasswordAction(
  _previous: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const parsed = parseChangePassword(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors };

  const { currentPassword, newPassword, code } = parsed.values;

  try {
    const tokens = await changePassword(currentPassword, newPassword, code || undefined);
    await startSession(tokens);
  } catch (error) {
    const refused = refusedCredential(error);
    if (refused) {
      const field = refused.field === "password" ? "currentPassword" : "code";
      return { error: null, fieldErrors: { [field]: refused.message } };
    }
    return { error: actionFailureMessage(error) };
  }

  revalidatePath(PASSWORD_PATH);
  return { error: null, done: "changed" };
}

/**
 * Sets the first password on an account that has only ever used Google.
 *
 * A second-factor code is the only credential this one checks, since there is
 * no password yet to re-authenticate with.
 */
export async function setPasswordAction(
  _previous: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const parsed = parseSetPassword(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors };

  try {
    const tokens = await setPassword(parsed.values.newPassword, parsed.values.code || undefined);
    await startSession(tokens);
  } catch (error) {
    const refused = refusedCredential(error);
    if (refused?.field === "code") {
      return { error: null, fieldErrors: { code: refused.message } };
    }
    return { error: actionFailureMessage(error) };
  }

  revalidatePath(PASSWORD_PATH);
  return { error: null, done: "set" };
}
