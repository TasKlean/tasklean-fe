/**
 * Exchanges an email and password for a token pair. Writes nothing — persisting
 * the result is the caller's job.
 */

import "server-only";

import { request } from "@/lib/api/client";
import type { AuthResponse } from "@/lib/auth/auth.types";

/**
 * Logs in with a password.
 *
 * @returns The token pair and the user's opaque uid.
 * @throws ApiError on any non-2xx. Unknown email, deactivated, Google-only,
 * unverified and wrong password are all an indistinguishable 401.
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
