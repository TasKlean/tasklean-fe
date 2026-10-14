/**
 * Revokes the session at the backend. Deletes no cookie: clearing the browser's
 * side is the caller's job, and it must happen whether or not this succeeds.
 */

import "server-only";

import { request } from "@/lib/api/client";
import type { RefreshRequest } from "@/lib/auth/auth.types";
import type { DeviceHeaders } from "@/lib/auth/device";

/**
 * Ends the session server-side, on this device only.
 *
 * Other browsers keep their sessions. A session sealed before devices existed
 * carries no device id and revokes only itself. Signing out everywhere is a
 * separate call, from account settings.
 *
 * @param device Device headers, which say which device to end.
 * @throws ApiError when the token is already spent or unknown.
 */
export async function revokeSession(
  refreshToken: string,
  device: DeviceHeaders = {},
): Promise<void> {
  const body: RefreshRequest = { refreshToken };
  await request<unknown>("/api/auth/logout", { method: "POST", body, headers: device });
}
