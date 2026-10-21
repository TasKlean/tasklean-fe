/**
 * The challenge token between a gated login and the code screen. An httpOnly
 * cookie rather than the URL or a hidden field: it is a credential, and the
 * browser never needs to read it.
 */

import "server-only";

import { cookies } from "next/headers";

export const CHALLENGE_COOKIE_NAME = "tasklean_2fa_challenge";

/** The backend kills the challenge after five minutes, so the cookie is no use past that. */
const MAX_AGE_SECONDS = 60 * 5;

const CHALLENGE_COOKIE_OPTIONS = {
  httpOnly: true,
  // NODE_ENV is Next's own variable, not app config, so it skips env.ts.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

/** Stores the challenge a gated sign-in handed back. */
export async function setChallenge(challengeToken: string): Promise<void> {
  (await cookies()).set(CHALLENGE_COOKIE_NAME, challengeToken, CHALLENGE_COOKIE_OPTIONS);
}

/**
 * Reads the pending challenge.
 *
 * @returns The token, or null when there is none to answer.
 */
export async function readChallenge(): Promise<string | null> {
  return (await cookies()).get(CHALLENGE_COOKIE_NAME)?.value ?? null;
}

/** Drops the challenge, spent or dead. */
export async function clearChallenge(): Promise<void> {
  (await cookies()).delete(CHALLENGE_COOKIE_NAME);
}
