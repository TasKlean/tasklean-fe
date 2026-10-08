// Exchanging a refresh token for a new token pair, de-duplicated.
//
// The backend's refresh tokens are SINGLE-USE WITH ROTATION: each successful
// refresh revokes the token presented and returns a new pair. That makes
// concurrent refreshes actively dangerous — the second caller would present a
// token the first just revoked, and the whole session dies. So every refresh
// for a given token shares one in-flight request.
//
// This module deliberately knows nothing about cookies. Persisting the new pair
// is the caller's job, because only a middleware, Route Handler or Server
// Action can write a cookie — a Server Component render cannot.

import "server-only";

import { request } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";

// The backend's AuthResponse. Note `token`, not `accessToken`, and no numeric
// user id — only `uid`.
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
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "RefreshFailedError";
    this.status = status;
  }
}

// Keyed by the refresh token being spent. Entries linger briefly after settling
// so a straggler that read the old cookie still gets the new pair instead of
// presenting the now-revoked token and killing the session.
const inFlight = new Map<string, Promise<RefreshedTokens>>();

const GRACE_MS = 10_000;

// Per-process only. On a multi-instance deploy two instances can still refresh
// concurrently; that is inherent to a shared-nothing deployment and would need
// a shared lock to solve properly.
export function refreshTokens(refreshToken: string): Promise<RefreshedTokens> {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;

  const pending = performRefresh(refreshToken);
  inFlight.set(refreshToken, pending);

  const forget = () => {
    setTimeout(() => inFlight.delete(refreshToken), GRACE_MS).unref?.();
  };
  pending.then(forget, () => inFlight.delete(refreshToken));

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

  // A 2xx that doesn't carry both tokens is unusable — treat it as a failure
  // rather than writing half a session back to the cookie.
  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new RefreshFailedError("Refresh succeeded but returned no token pair.");
  }

  return {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    userUid: response.uid,
  };
}
