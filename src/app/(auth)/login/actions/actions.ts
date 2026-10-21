/**
 * The login Server Action: the first place in the app that writes a session.
 * A Server Action rather than a Route Handler because Next checks `Origin`
 * against `Host`, so CSRF is covered without a token of our own.
 */

"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase/retry-phrase";
import { deviceHeaders } from "@/lib/auth/device/device";
import { isEmailUnverified, loginWithPassword } from "@/lib/auth/signin/login/login";
import { resendVerification } from "@/lib/auth/signin/verify-email/verify-email";
import { SIGNED_IN_HOME, safeNext, twoFactorPrompt } from "@/lib/auth/safe-next/safe-next";
import { setChallenge } from "@/lib/auth/two-factor-challenge/two-factor-challenge";
import { echoLogin, parseLogin } from "@/lib/validation/forms/login.schema/login.schema";
import { startSession } from "@/lib/auth/start-session/start-session";

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
  let gated = false;

  try {
    const outcome = await loginWithPassword(email, password, await deviceHeaders());
    if (outcome.kind === "challenge") {
      await setChallenge(outcome.challengeToken);
      gated = true;
    } else {
      await startSession(outcome.tokens);
    }
  } catch (error) {
    // Not a failure but a step: send a fresh code and move them on.
    if (isEmailUnverified(error)) {
      // A rate-limited resend must not block the redirect.
      await resendVerification(email).catch(() => {});
      unverified = true;
    } else if (isApiError(error)) {
      if (error.status === 429) {
        return { error: rateLimitMessage(error), email };
      }
      return { error: error.message || GENERIC_FAILURE, email };
    } else {
      return { error: GENERIC_FAILURE, email };
    }
  }

  // `resent` warns the screen that the earlier code is now dead.
  if (unverified) {
    const carried = next === SIGNED_IN_HOME ? "" : `&next=${encodeURIComponent(next)}`;
    redirect(`/verify-email?email=${encodeURIComponent(email)}&resent=1${carried}`);
  }

  // The password was right, but it is not a session until the code is too.
  if (gated) redirect(twoFactorPrompt(next));

  // Outside the try: redirect() signals by throwing.
  redirect(next);
}
