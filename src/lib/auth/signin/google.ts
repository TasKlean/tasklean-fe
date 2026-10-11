/**
 * Exchanges a Google ID token for our own token pair. Writes nothing, the same
 * as the password path: persisting the result is the caller's job.
 */

import "server-only";

import { request } from "@/lib/api/client";
import type { AuthResponse, GoogleAuthRequest } from "@/lib/auth/auth.types";

/**
 * Signs in with a Google ID token.
 *
 * One endpoint covers sign-up too: the backend matches the Google subject id,
 * links the account when the verified address is already registered, and
 * provisions a verified one otherwise.
 *
 * @param idToken The credential from Google Identity Services.
 * @param nonce The raw per-attempt secret whose hash the token carries.
 * @returns The token pair and the user's opaque uid.
 * @throws ApiError on any non-2xx. A rejected token, a nonce that does not
 * match, an unverified Google mailbox and a deactivated account all arrive as
 * 401; a missing nonce is a 400.
 * @throws Error when a 2xx arrives without a usable token pair.
 */
export async function signInWithGoogle(
  idToken: string,
  nonce: string,
): Promise<{ accessToken: string; refreshToken: string; userUid: string }> {
  const body: GoogleAuthRequest = { idToken, nonce };
  const response = await request<AuthResponse>("/api/auth/google", { method: "POST", body });

  // A session without a refresh token dies at the first expiry with no way back.
  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new Error("Google sign-in succeeded but returned no token pair.");
  }

  return {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    userUid: response.uid ?? "",
  };
}
