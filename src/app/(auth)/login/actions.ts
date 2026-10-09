/**
 * The login Server Action: the first place in the app that writes a session.
 * A Server Action rather than a Route Handler because Next checks `Origin`
 * against `Host`, so CSRF is covered without a token of our own.
 */

"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { loginWithPassword } from "@/lib/auth/signin/login";
import { safeNext } from "@/lib/auth/safe-next";
import { setSession } from "@/lib/auth/session";

export type LoginState = { error: string | null };

const GENERIC_FAILURE = "Something went wrong signing you in. Please try again.";

/**
 * Signs the user in and starts their session.
 *
 * @returns The error to display, or nothing because it redirected on success.
 */
export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next")?.toString());

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    const tokens = await loginWithPassword(email, password);
    await setSession({ ...tokens, activeGroupId: null });
  } catch (error) {
    // One 401 covers every credential failure, so its message is all there is.
    if (isApiError(error)) return { error: error.message || GENERIC_FAILURE };
    return { error: GENERIC_FAILURE };
  }

  // Outside the try: redirect() signals by throwing, and catching it would
  // render an error after a successful login.
  redirect(next);
}
