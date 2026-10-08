// The encrypted session cookie: the only place tokens are stored, and the only
// place they are read from. The browser must never see a JWT, so the cookie is
// httpOnly *and* its contents are encrypted (JWE), not merely signed.
//
// That distinction matters: a signed JWT's payload is plain base64url, readable
// by anyone holding the cookie. Next's own auth example signs rather than
// encrypts, which is fine for its `{ userId }` payload but would publish our
// refresh token. See the Time/Session notes in PROJECT_BIBLE.md.

import "server-only";

import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";

export type Session = {
  accessToken: string;
  refreshToken: string;
  // Users are addressed by `uid` in URLs. The numeric id that the `?userId=`
  // filters want is deliberately NOT stored: nothing needs it until
  // notifications/devices, and `GET /api/users/me` supplies it then. The
  // session holds the minimum it can.
  userUid: string;
  // A user belongs to several groups and nearly every list endpoint needs a
  // scope, so "which group am I looking at" lives with the session.
  activeGroupId: number | null;
};

export const SESSION_COOKIE_NAME = "tasklean_session";

// Tracks the backend's refresh-token TTL, giving a rolling 14-day session.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

// Shared with proxy.ts, which writes the cookie onto a NextResponse directly
// rather than through cookies() — the two must not drift.
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  // NODE_ENV is Next's own variable, not app config, so it does not go through
  // env.ts. Off in dev because local dev is plain http.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

let keyPromise: Promise<Uint8Array> | undefined;

// Derived with WebCrypto rather than node:crypto so this module also works in
// the Edge runtime, where middleware runs. SHA-256 gives the exactly-32 bytes
// A256GCM requires from a secret of any length; the secret is already
// high-entropy random, so no stretching is needed — but a short one would be
// silently expanded to 32 bytes, hence the length guard.
function getKey(): Promise<Uint8Array> {
  keyPromise ??= (async () => {
    const secret = getEnv().SESSION_SECRET;
    if (secret.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters.");
    }
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
    return new Uint8Array(digest);
  })();
  return keyPromise;
}

function toSession(payload: unknown): Session | null {
  if (typeof payload !== "object" || payload === null) return null;
  const value = payload as Record<string, unknown>;

  if (
    typeof value.accessToken !== "string" ||
    typeof value.refreshToken !== "string" ||
    typeof value.userUid !== "string" ||
    !(value.activeGroupId === null || typeof value.activeGroupId === "number")
  ) {
    return null;
  }

  // Rebuilt field by field so the JWT's own claims (iat, exp) don't leak into
  // the Session object callers see.
  return {
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    userUid: value.userUid,
    activeGroupId: value.activeGroupId,
  };
}

export async function sealSession(session: Session): Promise<string> {
  return new EncryptJWT({ ...session })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .encrypt(await getKey());
}

// Returns null rather than throwing: a tampered, expired, truncated or
// foreign-key cookie all mean exactly one thing to a caller — no session.
export async function unsealSession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, await getKey());
    return toSession(payload);
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return unsealSession(store.get(SESSION_COOKIE_NAME)?.value);
}

export async function setSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, await sealSession(session), SESSION_COOKIE_OPTIONS);
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
