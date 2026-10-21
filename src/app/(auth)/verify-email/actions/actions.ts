/**
 * Verifying is where a new account's session starts: the backend withholds the
 * token pair at register and issues it here.
 */

"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth/safe-next/safe-next";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase/retry-phrase";
import { deviceHeaders } from "@/lib/auth/device/device";
import { startSession } from "@/lib/auth/start-session/start-session";
import { resendVerification, verifyEmail } from "@/lib/auth/signin/verify-email/verify-email";
import {
  parseResend,
  parseVerifyEmail,
} from "@/lib/validation/forms/verify-email.schema/verify-email.schema";

export type VerifyState = {
  error: string | null;
  fieldErrors?: { email?: string; code?: string };
  notice?: string | null;
};

const GENERIC_FAILURE = "Something went wrong. Please try again.";

/**
 * Confirms the code and signs the user in.
 *
 * @returns The error to display, or nothing because it redirected on success.
 */
export async function verifyAction(
  _previous: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const parsed = parseVerifyEmail(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors };

  const { email, code } = parsed.values;
  const next = safeNext(parsed.values.next);

  try {
    const tokens = await verifyEmail(email, code, await deviceHeaders());
    await startSession(tokens);
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 429) {
        return { error: rateLimitMessage(error) };
      }
      // Wrong code, expired code, unknown address and already-verified all
      // arrive as one message, so there is nothing to tell them apart with.
      return { error: error.message || GENERIC_FAILURE };
    }
    return { error: GENERIC_FAILURE };
  }

  redirect(next);
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
  const parsed = parseResend(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: { email: parsed.error } };

  const { email } = parsed;

  try {
    await resendVerification(email);
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 429) {
        return { error: rateLimitMessage(error) };
      }
      return { error: error.message || GENERIC_FAILURE };
    }
    return { error: GENERIC_FAILURE };
  }

  return { error: null, notice: "If that address has an account, a new code is on its way." };
}
