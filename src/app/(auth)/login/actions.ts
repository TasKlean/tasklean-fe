/**
 * The login Server Action: the first place in the app that writes a session.
 * A Server Action rather than a Route Handler because Next checks `Origin`
 * against `Host`, so CSRF is covered without a token of our own.
 */

"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { isEmailUnverified, loginWithPassword } from "@/lib/auth/signin/login";
import { resendVerification } from "@/lib/auth/signin/verify-email";
import { safeNext } from "@/lib/auth/safe-next";
import { echoLogin, parseLogin } from "@/lib/validation/forms/login.schema";
import { setSession } from "@/lib/auth/session";

export type LoginState = {
  error: string | null;
  fieldErrors?: { email?: string; password?: string };
  // Echoed so a rejected submit does not clear the field. Never the password.
  email?: string;
};

const GENERIC_FAILURE = "Something went wrong signing you in. Please try again.";

/**
 * Signs the user in and starts their session.
 *
 * @returns The error to display, or nothing because it redirected on success.
 */
export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const submitted = Object.fromEntries(formData);
  const parsed = parseLogin(submitted);
  if (!parsed.ok) {
    return { error: null, fieldErrors: parsed.errors, email: echoLogin(submitted) };
  }

  const { email, password } = parsed.values;
  const next = safeNext(parsed.values.next);

  let unverified = false;

  try {
    const tokens = await loginWithPassword(email, password);
    await setSession({ ...tokens, activeGroupId: null });
  } catch (error) {
    // Not a failure but a step: send a fresh code and move them on.
    if (isEmailUnverified(error)) {
      // A rate-limited resend must not block the redirect.
      await resendVerification(email).catch(() => {});
      unverified = true;
    } else if (isApiError(error)) {
      return { error: error.message || GENERIC_FAILURE, email };
    } else {
      return { error: GENERIC_FAILURE, email };
    }
  }

  // `resent` warns the screen that the earlier code is now dead.
  if (unverified) redirect(`/verify-email?email=${encodeURIComponent(email)}&resent=1`);

  // Outside the try: redirect() signals by throwing.
  redirect(next);
}
