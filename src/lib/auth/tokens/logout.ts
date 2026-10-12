/**
 * Revokes the session at the backend. Deletes no cookie: clearing the browser's
 * side is the caller's job, and it must happen whether or not this succeeds.
 */

import "server-only";

import { request } from "@/lib/api/client";
import type { RefreshRequest } from "@/lib/auth/auth.types";

/**
 * Ends the session server-side.
 *
 * Revokes every refresh token the user holds, not just this one, so it signs
 * them out of every browser at once.
 *
 * @throws ApiError when the token is already spent or unknown.
 */
export async function revokeSession(refreshToken: string): Promise<void> {
  const body: RefreshRequest = { refreshToken };
  await request<unknown>("/api/auth/logout", { method: "POST", body });
}
