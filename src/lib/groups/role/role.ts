/**
 * The one place a role string is compared. No `server-only`: a row deciding
 * which buttons it owns runs in the browser, and both readings of the same
 * check live here, since `myRole` and a membership's `role` are the same enum.
 */

import { GROUP_ROLES, type GroupRole } from "@/lib/groups/groups.types";

// Typed, so a typo is a build failure rather than a role nobody matches.
const ADMIN: GroupRole = "GROUP_ADMIN";

/** Reports whether a string is one of the roles the backend sends. */
export function isGroupRole(value: string): value is GroupRole {
  // Widened: a readonly tuple's `includes` takes its own members only, and a
  // caller comparing an arbitrary string has nothing narrower to offer.
  return (GROUP_ROLES as readonly string[]).includes(value);
}

/** Reports whether a role administers its group. */
export function isGroupAdmin(role: string | undefined): boolean {
  return role === ADMIN;
}
