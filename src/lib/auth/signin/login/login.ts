/**
 * Exchanges an email and password for a token pair. Writes nothing — persisting
 * the result is the caller's job.
 */

import "server-only";

import { request } from "@/lib/api/client/client";
import { isApiError } from "@/lib/api/errors";
import type { AuthResponse, SignInOutcome } from "@/lib/auth/auth.types";
import type { DeviceHeaders } from "@/lib/auth/device/device";
import { signInOutcome } from "@/lib/auth/signin/outcome/outcome";

/**
 * Logs in with a password.
 *
 * @param device Device headers, so the backend binds this session to a device.
 * @returns A token pair, or the challenge an account with two-factor on gets
 * instead. The caller must branch before it persists anything.
 * @throws ApiError on any non-2xx. Unknown email and wrong password share one
 * message so neither can be probed for; deactivated, Google-only and unverified
 * each have their own.
 * @throws Error when a 2xx arrives without a usable token pair.
 */
export async function loginWithPassword(
  email: string,
  password: string,
  device: DeviceHeaders = {},
): Promise<SignInOutcome> {
  const response = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    headers: device,
  });

  return signInOutcome(response, "Login");
}

const UNVERIFIED_CODE = "EMAIL_NOT_VERIFIED";

// Fallback for a backend build older than the error code; a reworded message
// then degrades the redirect to simply showing the message.
const UNVERIFIED_MESSAGE = /not verified/i;

/** Reports whether a login failure was an unverified account. */
export function isEmailUnverified(error: unknown): boolean {
  if (!isApiError(error) || error.status !== 401) return false;
  return error.code === UNVERIFIED_CODE || (!error.code && UNVERIFIED_MESSAGE.test(error.message));
}
