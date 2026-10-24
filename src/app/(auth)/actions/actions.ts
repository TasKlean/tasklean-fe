/**
 * The Google sign-in Server Action, shared by `/login` and `/register`: the
 * backend decides between signing in, linking and provisioning, so both
 * screens post the same credential to the same place. It also owns the nonce's
 * single use: only a success spends it, because a refused attempt has to leave
 * the widget's own nonce alone.
 */

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { GoogleActionState } from "@/components/auth/google-button/google-button.types";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase/retry-phrase";
import {
  NONCE_COOKIE_NAME,
  NONCE_COOKIE_OPTIONS,
  createNonce,
  hashNonce,
} from "@/lib/auth/google-nonce/google-nonce";
import { deviceHeaders } from "@/lib/auth/device/device";
import { safeNext, twoFactorPrompt } from "@/lib/auth/safe-next/safe-next";
import { setChallenge } from "@/lib/auth/two-factor-challenge/two-factor-challenge";
import { startSession } from "@/lib/auth/start-session/start-session";
import { signInWithGoogle } from "@/lib/auth/signin/google/google";
import { parseGoogleSignIn } from "@/lib/validation/forms/google-signin.schema/google-signin.schema";

const GENERIC_FAILURE = "Something went wrong signing you in with Google. Please try again.";

const NO_NONCE = "That sign-in attempt expired. Please try again.";

/**
 * Mints a nonce for an attempt that found none, so the screen works again.
 *
 * Kept here rather than in `google-nonce.ts`, which Proxy imports and which
 * therefore cannot reach for `cookies()`. Only this branch needs it: a hash the
 * widget has not seen costs it a reload, so a refused attempt keeps its own.
 *
 * @returns The hash of the fresh nonce.
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
  _previous: GoogleActionState,
  formData: FormData,
): Promise<GoogleActionState> {
  const parsed = parseGoogleSignIn(Object.fromEntries(formData));
  if (!parsed.ok) {
    return { error: parsed.errors.idToken ?? GENERIC_FAILURE };
  }

  const store = await cookies();
  const nonce = store.get(NONCE_COOKIE_NAME)?.value;
  if (!nonce) return { error: NO_NONCE, nonceHash: await rearmNonce() };

  const next = safeNext(parsed.values.next);

  let gated = false;

  try {
    const outcome = await signInWithGoogle(parsed.values.idToken, nonce, await deviceHeaders());
    // Google's token was accepted either way, so the nonce is spent either way.
    store.delete(NONCE_COOKIE_NAME);
    if (outcome.kind === "challenge") {
      await setChallenge(outcome.challengeToken);
      gated = true;
    } else {
      await startSession(outcome.tokens);
    }
  } catch (error) {
    if (isApiError(error)) {
      const message = error.status === 429 ? rateLimitMessage(error) : error.message;
      return { error: message || GENERIC_FAILURE };
    }
    // Nothing else reports this: an env or network fault here is otherwise silent.
    console.error("Google sign-in failed", error);
    return { error: GENERIC_FAILURE };
  }

  // Google proved who they are, the second factor proves it is them.
  if (gated) redirect(twoFactorPrompt(next));

  // Outside the try: redirect() signals by throwing.
  redirect(next);
}
