/**
 * The register Server Action. Ends in a redirect to `/verify-email` rather than
 * a session: the backend issues no tokens until the emailed code is confirmed.
 */

"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { register } from "@/lib/auth/signin/register";
import { type RegisterErrors, validateRegister } from "@/lib/validation/register";

export type RegisterState = {
  error: string | null;
  fieldErrors?: RegisterErrors;
  // Echoed so a rejected submit keeps what was typed. Never the password.
  values?: { name?: string; lastName?: string; middleName?: string; email?: string };
};

const GENERIC_FAILURE = "Something went wrong creating your account. Please try again.";

/** Turns a `Retry-After` count of seconds into a phrase to show. */
function retryPhrase(seconds: number | null): string {
  if (!seconds || seconds < 60) return "Please try again shortly.";
  const minutes = Math.ceil(seconds / 60);
  return `Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

/**
 * Creates the account and sends the user on to verification.
 *
 * @returns The errors to display, or nothing because it redirected on success.
 */
export async function registerAction(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    middleName: String(formData.get("middleName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors = validateRegister({ ...values, password, confirmPassword });
  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors, values };
  }

  try {
    await register({
      ...values,
      password,
      middleName: values.middleName || undefined,
    });
  } catch (error) {
    if (isApiError(error)) {
      // A taken address belongs beside the email field, not in a banner.
      if (error.status === 409) {
        return { error: null, fieldErrors: { email: error.message }, values };
      }
      if (error.status === 429) {
        return { error: `${error.message} ${retryPhrase(error.retryAfterSeconds)}`, values };
      }
      return { error: error.message || GENERIC_FAILURE, values };
    }
    return { error: GENERIC_FAILURE, values };
  }

  // The address travels in the URL so the verify screen can show it without
  // asking again. It is the user's own, and never a secret.
  redirect(`/verify-email?email=${encodeURIComponent(values.email)}`);
}
