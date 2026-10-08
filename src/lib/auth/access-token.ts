// Reading the access token's expiry, so middleware can refresh *before* a 401
// rather than after one.
//
// The token is decoded, never verified — Spring is the only party that can
// verify its own signature, and we don't need to: the worst case of trusting
// `exp` here is refreshing slightly early or late, which is harmless. Treating
// an unreadable token as expired is the safe direction.

import { decodeJwt } from "jose";

// Refresh this far ahead of real expiry so a request never races the boundary.
// Staging/prod access tokens live 15 minutes, so a minute of slack is generous
// without causing constant refreshes.
export const REFRESH_SKEW_SECONDS = 60;

export function accessTokenExpiresWithin(
  token: string,
  seconds: number = REFRESH_SKEW_SECONDS,
): boolean {
  let exp: number | undefined;

  try {
    exp = decodeJwt(token).exp;
  } catch {
    return true;
  }

  if (typeof exp !== "number") return true;

  return exp * 1000 - Date.now() <= seconds * 1000;
}
