/**
 * Turning a group's fields into what the screen shows. No `server-only`, the
 * same way `users/name` has none: the card and the group page both render this,
 * and one of them is a link in the browser.
 */

import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";

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
