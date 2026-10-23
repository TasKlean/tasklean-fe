/**
 * Creates an unverified account. Returns no tokens — the backend withholds them
 * until the emailed code is confirmed, so there is no session to start here.
 */

import "server-only";

import { request } from "@/lib/api/client/client";
import type { AuthResponse, RegisterRequest } from "@/lib/auth/auth.types";
import type { DeviceHeaders } from "@/lib/auth/device/device";

/**
 * Registers an account and triggers the verification email.
 *
 * @param device Device headers, so the backend attributes this to the end user
 * rather than to our server.
 * @throws ApiError on any non-2xx; a duplicate address is a 409.
 */
export async function register(fields: RegisterRequest, device: DeviceHeaders = {}): Promise<void> {
  await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: fields,
    headers: device,
  });
}
