/**
 * Exchanges a refresh token for a new pair, de-duplicated.
 *
 * Refresh tokens are single-use with rotation: a successful refresh revokes the
 * token presented. So concurrent refreshes would revoke each other's token and
 * kill the session, and persisting the new pair is the caller's job — only
 * Proxy, a Route Handler or a Server Action can write a cookie.
 */

import "server-only";

import { request } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";

// The backend's AuthResponse: `token`, not `accessToken`, and no numeric id.
type AuthResponse = {
  token: string;
  refreshToken: string;
  uid: string;
};

export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
  userUid: string;
};

export class RefreshFailedError extends Error {
  /** The backend's status, or `null` when the failure wasn't an HTTP one. */
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "RefreshFailedError";
    this.status = status;
  }
}

// Keyed by the token being spent, so callers holding the same one converge.
const inFlight = new Map<string, Promise<RefreshedTokens>>();

// Successful entries linger this long so a straggler that read the old cookie
// gets the new pair instead of presenting a token that is already revoked.
const GRACE_MS = 10_000;

/**
 * Refreshes the token pair, sharing one request per refresh token.
 *
 * De-duplication is per-process and best-effort; two deployed instances can
 * still refresh concurrently, which would need a shared lock to prevent.
 *
 * @returns The rotated pair. The caller must persist it or the session is lost.
 * @throws RefreshFailedError when the backend refuses, or returns no pair.
 */
export function refreshTokens(refreshToken: string): Promise<RefreshedTokens> {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;

  const pending = performRefresh(refreshToken);
  inFlight.set(refreshToken, pending);

  // A failure is forgotten at once so a retry is possible; a success is kept
  // for the grace window.
  pending.then(
    () => {
      setTimeout(() => inFlight.delete(refreshToken), GRACE_MS).unref?.();
    },
    () => inFlight.delete(refreshToken),
  );

  return pending;
}

async function performRefresh(refreshToken: string): Promise<RefreshedTokens> {
  let response: AuthResponse;

  try {
    response = await request<AuthResponse>("/api/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
  } catch (error) {
    if (isApiError(error)) {
      throw new RefreshFailedError(error.message, error.status);
    }
    throw error;
  }

  // Half a pair is unusable, and writing it back would strand the session.
  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new RefreshFailedError("Refresh succeeded but returned no token pair.");
  }

  return {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    userUid: response.uid,
  };
}
