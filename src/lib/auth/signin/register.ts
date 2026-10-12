/**
 * Creates an unverified account. Returns no tokens — the backend withholds them
 * until the emailed code is confirmed, so there is no session to start here.
 */

import "server-only";

import { request } from "@/lib/api/client";
import type { AuthResponse, RegisterRequest } from "@/lib/auth/auth.types";

/**
 * Registers an account and triggers the verification email.
 *
 * @throws ApiError on any non-2xx; a duplicate address is a 409.
 */
export async function register(fields: RegisterRequest): Promise<void> {
  await request<AuthResponse>("/api/auth/register", { method: "POST", body: fields });
}
