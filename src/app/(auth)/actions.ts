/**
 * The Google sign-in Server Action, shared by `/login` and `/register`: the
 * backend decides between signing in, linking and provisioning, so both
 * screens post the same credential to the same place. It also owns the nonce's
 * single use, which is why every outcome replaces it.
 */

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase";
import {
  NONCE_COOKIE_NAME,
  NONCE_COOKIE_OPTIONS,
  createNonce,
  hashNonce,
} from "@/lib/auth/google-nonce";
import { deviceHeaders } from "@/lib/auth/device";
import { safeNext } from "@/lib/auth/safe-next";
import { startSession } from "@/lib/auth/start-session";
import { signInWithGoogle } from "@/lib/auth/signin/google";
import { parseGoogleSignIn } from "@/lib/validation/forms/google-signin.schema";

export type GoogleSignInState = {
  error: string | null;
  // The hash of the nonce minted for the next attempt, since this one is spent.
  nonceHash?: string;
};

const GENERIC_FAILURE = "Something went wrong signing you in with Google. Please try again.";

const NO_NONCE = "That sign-in attempt expired. Please try again.";

/**
 * Replaces the spent nonce so the button on screen stays usable.
 *
 * @returns The hash of the fresh nonce, for Google's next credential.
 */
async function rearmNonce(): Promise<string> {
  const nonce = createNonce();
  (await cookies()).set(NONCE_COOKIE_NAME, nonce, NONCE_COOKIE_OPTIONS);
  return hashNonce(nonce);
}

/**
 * Exchanges a Google credential for a session.
 *
 * @returns The error to display, or nothing because it redirected on success.
 */
export async function googleSignInAction(
  _previous: GoogleSignInState,
  formData: FormData,
): Promise<GoogleSignInState> {
  const parsed = parseGoogleSignIn(Object.fromEntries(formData));
  if (!parsed.ok) {
    return { error: parsed.errors.idToken ?? GENERIC_FAILURE, nonceHash: await rearmNonce() };
  }

  const store = await cookies();
  const nonce = store.get(NONCE_COOKIE_NAME)?.value;
  if (!nonce) return { error: NO_NONCE, nonceHash: await rearmNonce() };

  const next = safeNext(parsed.values.next);

  try {
    const tokens = await signInWithGoogle(parsed.values.idToken, nonce, await deviceHeaders());
    store.delete(NONCE_COOKIE_NAME);
    await startSession(tokens);
  } catch (error) {
    if (isApiError(error)) {
      const message = error.status === 429 ? rateLimitMessage(error) : error.message;
      return { error: message || GENERIC_FAILURE, nonceHash: await rearmNonce() };
    }
    // Nothing else reports this: an env or network fault here is otherwise silent.
    console.error("Google sign-in failed", error);
    return { error: GENERIC_FAILURE, nonceHash: await rearmNonce() };
  }

  // Outside the try: redirect() signals by throwing.
  redirect(next);
}
