/**
 * Reads the access token's expiry so Proxy can refresh before a 401 rather than
 * after one. The token is decoded, never verified: only Spring can verify its
 * own signature, and nothing here is a security boundary.
 */

import { decodeJwt } from "jose";

/** Staging and prod access tokens live 15 minutes, so a minute of slack is ample. */
export const REFRESH_SKEW_SECONDS = 60;

/**
 * Reports whether the access token expires inside the given window.
 *
 * @param seconds How far ahead to look; defaults to {@link REFRESH_SKEW_SECONDS}.
 * @returns `true` when the token expires within the window — and for an
 * unreadable token or one with no `exp`, since refreshing early is the safe
 * direction and failing to refresh kills the session.
 */
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
