/**
 * Seals a fresh token pair into the session cookie, with the display fields the
 * chrome needs. Every sign-in path ends here so none of them drifts.
 */

import "server-only";

import type { SignedInTokens } from "@/lib/auth/auth.types";
import { setSession } from "@/lib/auth/session";
import { fetchProfile } from "@/lib/users/me";

/**
 * Starts a session from a credential exchange.
 *
 * The profile call is best effort and deliberately swallowed: the auth response
 * carries no `photoUrl`, so this is the only way the avatar reaches the chrome
 * without a request per page, and a failure must cost an avatar, never a login.
 */
export async function startSession(tokens: SignedInTokens): Promise<void> {
  const profile = await fetchProfile(tokens.accessToken).catch(() => null);
  const name = tokens.name ?? profile?.name;

  await setSession({
    ...tokens,
    activeGroupId: null,
    ...(name ? { name } : {}),
    ...(profile?.photoUrl ? { photoUrl: profile.photoUrl } : {}),
  });
}
