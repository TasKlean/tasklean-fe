/**
 * Turning a group's fields into what the screen shows. No `server-only`, the
 * same way `users/name` has none: the card and the group page both render this,
 * and one of them is a link in the browser.
 */

import type { GroupMemberUser } from "@/lib/groups/groups.types";
import { isGroupAdmin } from "@/lib/groups/role/role";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { fullName } from "@/lib/users/name/name";

/**
 * Names a group.
 *
 * @returns The name, or a stand-in: nothing in the contract is required, and a
 * card with no label at all would be an unreadable link.
 */
export function groupLabel(name: string | undefined): string {
  return name?.trim() || "Untitled group";
}

/**
 * Counts a group's members.
 *
 * @returns The count in words, or null when the backend sent none, so a caller
 * can leave the line out rather than print a question mark.
 */
export function memberCountLabel(count: number | undefined): string | null {
  if (typeof count !== "number" || !Number.isFinite(count) || count < 0) return null;

  return `${count} member${count === 1 ? "" : "s"}`;
}

/**
 * Says when the caller joined.
 *
 * @returns The month and year, or null when the row carried no date. The locale
 * is fixed, because this renders on the server, where the system one is the
 * container's rather than the reader's.
 */
export function joinedLabel(dateJoined: string | undefined): string | null {
  const joined = parseApiDateOrNull(dateJoined);
  if (!joined) return null;

  return `Joined ${joined.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
}

/**
 * Says when a group was made.
 *
 * @returns The day, month and year, or null when the group carried no date.
 * The locale is fixed for the same reason the joined line's is.
 */
export function createdLabel(dateCreated: string | undefined): string | null {
  const created = parseApiDateOrNull(dateCreated);
  if (!created) return null;

  return `Created ${created.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
}

/**
 * Names the person behind a membership.
 *
 * @returns Their name, or a stand-in: the roster shows no addresses, so a
 * membership the backend sent no name with has nothing else to be called by.
 */
export function memberName(user: GroupMemberUser | undefined): string {
  return fullName(user?.name, user?.lastName) ?? "Unnamed member";
}

/**
 * Says what a member may do in their group.
 *
 * @returns The word a chip wears. Anything that is not the admin role reads as
 * a plain member, the same way every other role check here does.
 */
export function roleLabel(role: string | undefined): string {
  return isGroupAdmin(role) ? "Admin" : "Member";
}
