/**
 * The one place that reads a sign-in response. Login and Google may now answer
 * with a challenge instead of a token pair, and reading `token` without
 * checking `twoFactorRequired` first lands the user in a half-signed-in state.
 */

import "server-only";

import type { AuthResponse, SignInOutcome } from "@/lib/auth/auth.types";

/**
 * Narrows a sign-in response into what it actually produced.
 *
 * @param label How to name the exchange in a thrown message, e.g. `Login`.
 * @returns A challenge when the backend gated the sign-in, a token pair otherwise.
 * @throws TypeError when a 2xx carries neither, which would otherwise look like a
 * session with no tokens in it.
 */
export function signInOutcome(response: AuthResponse | undefined, label: string): SignInOutcome {
  if (response?.twoFactorRequired === true) {
    if (typeof response.challengeToken !== "string" || response.challengeToken === "") {
      throw new TypeError(`${label} needs a second factor but returned no challenge token.`);
    }
    return { kind: "challenge", challengeToken: response.challengeToken };
  }

  // A session without a refresh token dies at the first expiry with no way back.
  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new TypeError(`${label} succeeded but returned no token pair.`);
  }

  return {
    kind: "session",
    tokens: {
      accessToken: response.token,
      refreshToken: response.refreshToken,
      userUid: response.uid ?? "",
      name: response.name,
    },
  };
}
