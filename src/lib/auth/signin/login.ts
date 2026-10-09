/**
 * Exchanges an email and password for a token pair. Writes nothing — persisting
 * the result is the caller's job.
 */

import "server-only";

import { request } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { AuthResponse } from "@/lib/auth/auth.types";

/**
 * Logs in with a password.
 *
 * @returns The token pair and the user's opaque uid.
 * @throws ApiError on any non-2xx. Unknown email and wrong password share one
 * message so neither can be probed for; deactivated, Google-only and unverified
 * each have their own.
 * @throws Error when a 2xx arrives without a usable token pair.
 */
export async function loginWithPassword(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; userUid: string }> {
  const response = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  // A session without a refresh token dies at the first expiry with no way back.
  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new Error("Login succeeded but returned no token pair.");
  }

  return {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    userUid: response.uid ?? "",
  };
}

// Every login failure is a 401 with no error code, so the message is the only
// signal. Loose on purpose: a reworded message degrades, not breaks.
const UNVERIFIED = /not verified/i;

/** Reports whether a login failure was an unverified account. */
export function isEmailUnverified(error: unknown): boolean {
  return isApiError(error) && error.status === 401 && UNVERIFIED.test(error.message);
}
