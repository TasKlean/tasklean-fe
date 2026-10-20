/**
 * Exchanges a Google ID token for our own token pair. Writes nothing, the same
 * as the password path: persisting the result is the caller's job.
 */

import "server-only";

import { request } from "@/lib/api/client";
import type { AuthResponse, GoogleAuthRequest, SignInOutcome } from "@/lib/auth/auth.types";
import type { DeviceHeaders } from "@/lib/auth/device";
import { signInOutcome } from "@/lib/auth/signin/outcome";

/**
 * Signs in with a Google ID token.
 *
 * One endpoint covers sign-up too: the backend matches the Google subject id,
 * links the account when the verified address is already registered, and
 * provisions a verified one otherwise.
 *
 * @param idToken The credential from Google Identity Services.
 * @param nonce The raw per-attempt secret whose hash the token carries.
 * @param device Device headers, so the backend binds this session to a device.
 * @returns A token pair, or the challenge an account with two-factor on gets
 * instead. The caller must branch before it persists anything.
 * @throws ApiError on any non-2xx. A rejected token, a nonce that does not
 * match, an unverified Google mailbox and a deactivated account all arrive as
 * 401; a missing nonce is a 400.
 * @throws Error when a 2xx arrives without a usable token pair.
 */
export async function signInWithGoogle(
  idToken: string,
  nonce: string,
  device: DeviceHeaders = {},
): Promise<SignInOutcome> {
  const body: GoogleAuthRequest = { idToken, nonce };
  const response = await request<AuthResponse>("/api/auth/google", {
    method: "POST",
    body,
    headers: device,
  });

  return signInOutcome(response, "Google sign-in");
}
