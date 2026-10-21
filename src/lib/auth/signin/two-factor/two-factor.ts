/**
 * Finishes a sign-in that needed a second factor. Public like login itself: the
 * challenge token is the credential, so there is no session to call this with.
 */

import "server-only";

import { request } from "@/lib/api/client/client";
import { isApiError } from "@/lib/api/errors";
import type { AuthResponse, SignedInTokens, TwoFactorVerifyRequest } from "@/lib/auth/auth.types";
import type { DeviceHeaders } from "@/lib/auth/device/device";

// The two 401s that end the attempt. Any other is the code's own verdict, so
// it stays on the screen as a field error.
const CHALLENGE_INVALID = "TWO_FACTOR_CHALLENGE_INVALID";

const DEACTIVATED = "ACCOUNT_DEACTIVATED";

/**
 * Exchanges a challenge and a code for a token pair.
 *
 * @param code An authenticator code or a recovery code, already normalised.
 * @param device Device headers. Not optional in practice: the device row and
 * the new-sign-in email are created here now, not at login.
 * @returns The token pair and the user's opaque uid.
 * @throws ApiError on 401 for a wrong code, a dead challenge or a deactivated
 * account, and on 429 once this IP has spent its ten attempts a minute.
 * @throws Error when a 2xx arrives without a usable token pair.
 */
export async function verifyTwoFactor(
  challengeToken: string,
  code: string,
  device: DeviceHeaders = {},
): Promise<SignedInTokens> {
  const body: TwoFactorVerifyRequest = { challengeToken, code };
  const response = await request<AuthResponse>("/api/auth/2fa/verify", {
    method: "POST",
    body,
    headers: device,
  });

  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new Error("Two-factor verification succeeded but returned no token pair.");
  }

  return {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    userUid: response.uid ?? "",
    name: response.name,
  };
}

/**
 * Reports whether the challenge itself is gone: unknown, expired, already
 * spent, or out of its five attempts. Only the code counts, since an uncoded
 * 401 is better shown against the field than treated as a dead end.
 */
export function isChallengeDead(error: unknown): boolean {
  return isApiError(error) && error.status === 401 && error.code === CHALLENGE_INVALID;
}

/** Reports whether the account behind the challenge is deactivated. */
export function isAccountDeactivated(error: unknown): boolean {
  return isApiError(error) && error.status === 401 && error.code === DEACTIVATED;
}
