/**
 * The connected accounts section's Server Actions: linking a Google account to this
 * one, and unlinking it. Linking runs the same credential exchange as signing
 * in, so it owns the nonce's single use the same way.
 */

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { GoogleActionState } from "@/components/auth/google-button.types";
import { linkGoogle, unlinkGoogle } from "@/lib/account/account";
import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure";
import {
  NONCE_COOKIE_NAME,
  NONCE_COOKIE_OPTIONS,
  createNonce,
  hashNonce,
} from "@/lib/auth/google-nonce";
import { parseGoogleSignIn } from "@/lib/validation/forms/google-signin.schema";

export type ConnectedAccountsActionState = {
  error: string | null;
  done?: boolean;
};

const CONNECTED_ACCOUNTS_PATH = "/app/settings/connected-accounts";

const NO_NONCE = "That attempt expired. Please try again.";

/**
 * Replaces the spent nonce so the widget on screen stays usable.
 *
 * Kept here rather than in `google-nonce.ts`, which Proxy imports and which
 * therefore cannot reach for `cookies()`.
 *
 * @returns The hash of the fresh nonce, for Google's next credential.
 */
async function rearmNonce(): Promise<string> {
  const nonce = createNonce();
  (await cookies()).set(NONCE_COOKIE_NAME, nonce, NONCE_COOKIE_OPTIONS);
  return hashNonce(nonce);
}

/** Links the Google account the widget just authenticated. */
export async function linkGoogleAction(
  _previous: GoogleActionState,
  formData: FormData,
): Promise<GoogleActionState> {
  // The sign-in schema fits: a credential plus the `next` this one ignores.
  const parsed = parseGoogleSignIn(Object.fromEntries(formData));
  if (!parsed.ok) {
    return { error: parsed.errors.idToken ?? GENERIC_FAILURE, nonceHash: await rearmNonce() };
  }

  const store = await cookies();
  const nonce = store.get(NONCE_COOKIE_NAME)?.value;
  if (!nonce) return { error: NO_NONCE, nonceHash: await rearmNonce() };

  try {
    await linkGoogle(parsed.values.idToken, nonce);
  } catch (error) {
    return { error: actionFailureMessage(error), nonceHash: await rearmNonce() };
  }

  store.delete(NONCE_COOKIE_NAME);
  revalidatePath(CONNECTED_ACCOUNTS_PATH);
  return { error: null };
}

/** Unlinks the Google account, which the backend refuses without a password. */
export async function unlinkGoogleAction(
  _previous: ConnectedAccountsActionState,
): Promise<ConnectedAccountsActionState> {
  try {
    await unlinkGoogle();
  } catch (error) {
    return { error: actionFailureMessage(error) };
  }

  revalidatePath(CONNECTED_ACCOUNTS_PATH);
  return { error: null, done: true };
}
