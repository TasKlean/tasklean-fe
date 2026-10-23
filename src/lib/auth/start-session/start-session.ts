/**
 * Seals a fresh token pair into the session cookie, with the display fields the
 * chrome needs. Every sign-in path ends here so none of them drifts.
 */

import "server-only";

import type { SignedInTokens } from "@/lib/auth/auth.types";
import { deviceHeaders } from "@/lib/auth/device/device";
import { setSession } from "@/lib/auth/session/session";
import { fetchPreferences } from "@/lib/preferences/preferences";
import { DEFAULT_PREFERENCES } from "@/lib/preferences/preferences.types";
import { writeTheme } from "@/lib/preferences/theme-cookie/theme-cookie";
import { fetchProfile } from "@/lib/users/me/me";

/**
 * Starts a session from a credential exchange.
 *
 * Both reads are best effort and deliberately swallowed. The auth response
 * carries no `photoUrl`, so the profile call is the only way the avatar reaches
 * the chrome without a request per page, and the theme has to be cached before
 * the first render; a failure must cost an avatar or a colour, never a login.
 */
export async function startSession(tokens: SignedInTokens): Promise<void> {
  // Read here rather than threaded from all eight callers: this module already
  // writes cookies, so it is in a request scope either way.
  const device = await deviceHeaders();
  const [profile, preferences] = await Promise.all([
    fetchProfile(tokens.accessToken, device).catch(() => null),
    fetchPreferences(tokens.accessToken, device).catch(() => null),
  ]);

  const name = tokens.name ?? profile?.name;

  // An exchange that answers with the pair alone leaves the uid to the profile
  // call; an empty one from an older response means the same as none.
  const userUid = tokens.userUid || profile?.uid || "";

  // Written on every sign-in, not only when it is known: a browser must never
  // keep painting the theme of the account that used it last.
  await writeTheme(preferences?.theme ?? DEFAULT_PREFERENCES.theme);

  await setSession({
    ...tokens,
    userUid,
    activeGroupId: null,
    ...(name ? { name } : {}),
    ...(profile?.photoUrl ? { photoUrl: profile.photoUrl } : {}),
  });
}
