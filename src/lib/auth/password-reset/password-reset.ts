/**
 * The forgot and reset password exchanges. Neither belongs in `signin/`: one
 * sends an email and the other changes a password, and neither returns a token
 * pair, so a reset always ends at the login screen.
 */

import "server-only";

import { request } from "@/lib/api/client/client";
import type { ForgotPasswordRequest, ResetPasswordRequest } from "@/lib/auth/auth.types";

/**
 * Asks for a reset link.
 *
 * Always resolves for a well-formed address. The backend answers 200 whether or
 * not the account exists, and emails a Google-only account a "nothing to reset"
 * notice instead, so a caller must never imply that a link went out.
 *
 * @throws ApiError only on a transport or rate-limit failure.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const body: ForgotPasswordRequest = { email };
  await request<unknown>("/api/auth/forgot-password", { method: "POST", body });
}

/**
 * Sets a new password from an emailed token.
 *
 * The token is single use and expires 15 minutes after it is sent. Success
 * revokes every refresh token the user holds, so every session, this browser's
 * included, is dead afterwards and the new password has to be used to sign in.
 *
 * @throws ApiError on failure. Unknown, already spent and expired tokens are
 * one indistinguishable 401, by design.
 */
export async function completePasswordReset(token: string, newPassword: string): Promise<void> {
  const body: ResetPasswordRequest = { token, newPassword };
  await request<unknown>("/api/auth/reset-password", { method: "POST", body });
}
