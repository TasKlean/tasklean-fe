/**
 * The register Server Action. Ends in a redirect to `/verify-email` rather than
 * a session: the backend issues no tokens until the emailed code is confirmed.
 */

"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase/retry-phrase";
import { deviceHeaders } from "@/lib/auth/device/device";
import { register } from "@/lib/auth/signin/register/register";
import {
  echoRegister,
  type RegisterErrors,
  parseRegister,
} from "@/lib/validation/forms/register.schema/register.schema";

export type RegisterState = {
  error: string | null;
  fieldErrors?: RegisterErrors;
  // Echoed so a rejected submit keeps what was typed. Never the password.
  values?: { name?: string; lastName?: string; middleName?: string; email?: string };
};

const GENERIC_FAILURE = "Something went wrong creating your account. Please try again.";

/**
 * Creates the account and sends the user on to verification.
 *
 * @returns The errors to display, or nothing because it redirected on success.
 */
export async function registerAction(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const submitted = Object.fromEntries(formData);
  const parsed = parseRegister(submitted);
  if (!parsed.ok) {
    return { error: null, fieldErrors: parsed.errors, values: echoRegister(submitted) };
  }

  const { name, lastName, middleName, email, password } = parsed.values;
  const values = { name, lastName, middleName, email };

  try {
    await register(
      {
        ...values,
        password,
        middleName: values.middleName || undefined,
      },
      await deviceHeaders(),
    );
  } catch (error) {
    if (isApiError(error)) {
      // A taken address belongs beside the email field, not in a banner.
      if (error.status === 409) {
        return { error: null, fieldErrors: { email: error.message }, values };
      }
      if (error.status === 429) {
        return { error: rateLimitMessage(error), values };
      }
      return { error: error.message || GENERIC_FAILURE, values };
    }
    return { error: GENERIC_FAILURE, values };
  }

  // The address travels in the URL so the verify screen can show it without
  // asking again. It is the user's own, and never a secret.
  redirect(`/verify-email?email=${encodeURIComponent(values.email)}`);
}
