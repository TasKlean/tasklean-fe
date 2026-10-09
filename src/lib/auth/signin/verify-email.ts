/**
 * Confirms the emailed code, and resends it. Verifying returns a token pair —
 * the backend withholds one at register and issues it here, so this is where a
 * new account's session starts.
 */

import "server-only";

import { request } from "@/lib/api/client";
import type { AuthResponse } from "@/lib/auth/auth.types";

/**
 * Verifies an emailed code.
 *
 * @returns The token pair and the user's opaque uid.
 * @throws ApiError on failure. Unknown address, already verified, wrong code
 * and expired code are one indistinguishable message, by design.
 * @throws Error when a 2xx arrives without a usable token pair.
 */
export async function verifyEmail(
  email: string,
  code: string,
): Promise<{ accessToken: string; refreshToken: string; userUid: string }> {
  const response = await request<AuthResponse>("/api/auth/verify-email", {
    method: "POST",
    body: { email, code },
  });

  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new Error("Verification succeeded but returned no token pair.");
  }

  return {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    userUid: response.uid ?? "",
  };
}

/**
 * Asks for a new code.
 *
 * Always resolves for any well-formed address: the backend answers 200 whether
 * or not the account exists, so callers must not imply that it does.
 *
 * @throws ApiError only on a transport or rate-limit failure.
 */
export async function resendVerification(email: string): Promise<void> {
  await request<AuthResponse>("/api/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
}
