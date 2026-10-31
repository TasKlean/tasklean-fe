/**
 * The one place a role string is compared. No `server-only`: a row deciding
 * which buttons it owns runs in the browser, and both readings of the same
 * check live here, since `myRole` and a membership's `role` are the same enum.
 */

import type { GroupRole } from "@/lib/groups/groups.types";

// Typed, so a typo is a build failure rather than a role nobody matches.
const ADMIN: GroupRole = "GROUP_ADMIN";

/** Reports whether a role administers its group. */
export function isGroupAdmin(role: string | undefined): boolean {
  return role === ADMIN;
}
