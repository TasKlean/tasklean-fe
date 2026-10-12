/**
 * The forgot-password Server Action. It never redirects: the backend answers
 * 200 whether or not the address has an account, so the only honest outcome is
 * a neutral notice on the same screen.
 */

"use server";

import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import {
  echoForgotPassword,
  parseForgotPassword,
} from "@/lib/validation/forms/forgot-password.schema";

export type ForgotPasswordState = {
  error: string | null;
  fieldErrors?: { email?: string };
  notice?: string | null;
  // Echoed so the address stays in the field after a rejected submit.
  email?: string;
};

const GENERIC_FAILURE = "Something went wrong sending that link. Please try again.";

const SENT =
  "If that address has an account, we have emailed a reset link. It expires 15 minutes after it is sent.";

/**
 * Asks the backend to email a reset link.
 *
 * @returns The neutral notice on success, or the error to display.
 */
export async function forgotPasswordAction(
  _previous: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const submitted = Object.fromEntries(formData);
  const parsed = parseForgotPassword(submitted);
  if (!parsed.ok) {
    return { error: null, fieldErrors: parsed.errors, email: echoForgotPassword(submitted) };
  }

  const { email } = parsed.values;

  try {
    await requestPasswordReset(email);
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 429) {
        return { error: rateLimitMessage(error), email };
      }
      return { error: error.message || GENERIC_FAILURE, email };
    }
    return { error: GENERIC_FAILURE, email };
  }

  return { error: null, notice: SENT, email };
}
