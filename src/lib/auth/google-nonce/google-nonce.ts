/**
 * The per-attempt secret behind Google sign-in. The browser only ever sees its
 * SHA-256; the raw value stays in an httpOnly cookie, so a stolen ID token
 * cannot be replayed by echoing back the nonce it already carries.
 */

import "server-only";

export const NONCE_COOKIE_NAME = "tasklean_google_nonce";

// Proxy mints the nonce and the page needs its hash, but a render cannot set a
// cookie, so the hash travels forward on the request instead.
export const NONCE_HEADER_NAME = "x-tasklean-google-nonce";

/** One sign-in attempt, not a session: long enough to finish Google's dialog. */
const MAX_AGE_SECONDS = 60 * 10;

export const NONCE_COOKIE_OPTIONS = {
  httpOnly: true,
  // NODE_ENV is Next's own variable, not app config, so it skips env.ts.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

/** Renders bytes as lowercase hex, the form the backend compares against. */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Mints a nonce: 32 random bytes, well above the UUID the backend calls the floor. */
export function createNonce(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Hashes a nonce the way the backend will.
 *
 * @returns Lowercase hex SHA-256 over the raw value's UTF-8 bytes. WebCrypto,
 * not node:crypto, because this runs in the Edge runtime where Proxy does.
 */
export async function hashNonce(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return toHex(new Uint8Array(digest));
}
