/**
 * Verifying is where a new account's session starts — the backend withholds the
 * token pair at register and issues it here.
 */

"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { setSession } from "@/lib/auth/session";
import { resendVerification, verifyEmail } from "@/lib/auth/signin/verify-email";
import { validateCode } from "@/lib/validation/code";
import { validateEmail } from "@/lib/validation/email";

export type VerifyState = {
  error: string | null;
  fieldErrors?: { email?: string; code?: string };
  notice?: string | null;
};

const GENERIC_FAILURE = "Something went wrong. Please try again.";

/** Turns a `Retry-After` count of seconds into a phrase to show. */
function retryPhrase(seconds: number | null): string {
  if (!seconds || seconds < 60) return "Please try again shortly.";
  const minutes = Math.ceil(seconds / 60);
  return `Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

/**
 * Confirms the code and signs the user in.
 *
 * @returns The error to display, or nothing because it redirected on success.
 */
export async function verifyAction(
  _previous: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  const fieldErrors = {
    email: validateEmail(email) ?? undefined,
    code: validateCode(code) ?? undefined,
  };
  if (fieldErrors.email || fieldErrors.code) {
    return { error: null, fieldErrors };
  }

  try {
    const tokens = await verifyEmail(email, code);
    await setSession({ ...tokens, activeGroupId: null });
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 429) {
        return { error: `${error.message} ${retryPhrase(error.retryAfterSeconds)}` };
      }
      // Wrong code, expired code, unknown address and already-verified all
      // arrive as one message, so there is nothing to tell them apart with.
      return { error: error.message || GENERIC_FAILURE };
    }
    return { error: GENERIC_FAILURE };
  }

  redirect("/");
}

/**
 * Sends a new code.
 *
 * @returns A notice worded so it never confirms the address has an account,
 * because the backend answers 200 either way.
 */
export async function resendAction(
  _previous: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();

  const emailError = validateEmail(email);
  if (emailError) return { error: null, fieldErrors: { email: emailError } };

  try {
    await resendVerification(email);
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 429) {
        return { error: `${error.message} ${retryPhrase(error.retryAfterSeconds)}` };
      }
      return { error: error.message || GENERIC_FAILURE };
    }
    return { error: GENERIC_FAILURE };
  }

  return { error: null, notice: "If that address has an account, a new code is on its way." };
}
