/**
 * The encrypted session cookie — the only place tokens are stored or read.
 * Encrypted (JWE), not signed: a signed payload would publish the refresh token.
 */

import "server-only";

import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/config/env";

export type Session = {
  accessToken: string;
  refreshToken: string;
  userUid: string;
  activeGroupId: number | null;
};

export const SESSION_COOKIE_NAME = "tasklean_session";

/** Tracks the backend's refresh-token TTL, giving a rolling 14-day session. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

/**
 * Shared with `proxy.ts`, which writes the cookie onto a `NextResponse`
 * directly rather than through `cookies()`. The two must not drift.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  // NODE_ENV is Next's own variable, not app config, so it skips env.ts.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

let keyPromise: Promise<Uint8Array> | undefined;

// WebCrypto, not node:crypto, so this runs in the Edge runtime where Proxy does.
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

/**
 * Narrows a decrypted JWE payload back to a Session.
 *
 * The payload is whatever was sealed, which may be an older shape after a
 * deploy, so every field is checked rather than trusted.
 *
 * @returns The session, or null when a required field is missing or mistyped.
 */
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

  // Rebuilt field by field so the JWT's own iat/exp claims don't leak into the
  // Session that callers see.
  return {
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    userUid: value.userUid,
    activeGroupId: value.activeGroupId,
  };
}

/**
 * Encrypts a session into a cookie value.
 *
 * @returns A JWE string, opaque to anyone without `SESSION_SECRET`.
 */
export async function sealSession(session: Session): Promise<string> {
  return new EncryptJWT({ ...session })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .encrypt(await getKey());
}

/**
 * Decrypts and validates a cookie value.
 *
 * @returns The session, or `null` — a missing, tampered, expired or
 * foreign-key cookie all mean the same thing to a caller, so none of them throw.
 */
export async function unsealSession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, await getKey());
    return toSession(payload);
  } catch {
    return null;
  }
}

/**
 * Reads the session from the incoming request's cookie.
 *
 * @returns The session, or `null` when there isn't a usable one.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return unsealSession(store.get(SESSION_COOKIE_NAME)?.value);
}

/**
 * Writes the session cookie.
 *
 * Only callable from a Route Handler or Server Action — a Server Component
 * render cannot set cookies.
 */
export async function setSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, await sealSession(session), SESSION_COOKIE_OPTIONS);
}

/**
 * Deletes the session cookie, signing the user out of this browser.
 *
 * Same call-site restriction as {@link setSession}.
 */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
