/**
 * Naming what a group's trail is about. A ref is an identifier and the backend
 * sends no label with it, so the roster is read once per view: it names the
 * membership rows of every page the reader goes on to load, and it is the only
 * screen a group's trail can borrow a name from.
 */

import type { AuditNames } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";
import { listGroupMembers } from "@/lib/groups/members/members";
import { fullName } from "@/lib/users/name/name";

/**
 * Reads the names a feed can show, keyed by the ref its rows carry.
 *
 * @param groupUid The group in the route.
 * @returns One entry per active membership, and nothing for a member who has
 * left: the roster holds active rows only, so a removal names the kind rather
 * than the person. Empty where the roster would not load.
 */
export async function memberNames(groupUid: string): Promise<AuditNames> {
  try {
    const members = await listGroupMembers(groupUid);
    const names: AuditNames = {};

    for (const member of members) {
      const name = fullName(member.user?.name, member.user?.lastName);
      if (member.uid && name) names[member.uid] = { name, userUid: member.user?.uid };
    }

    return names;
  } catch {
    // A name is decoration here, so a failed roster read costs the names only.
    return {};
  }
}

/**
 * Resolves what the pinned entity is called.
 *
 * @param groupUid The group in the route.
 * @param filter The filter the URL carried.
 * @param groupName The open group's name, which the shell has already read.
 * @param names The names read for this view.
 * @returns The name, or null for a kind we have no screen to resolve from and
 * for a membership the roster no longer holds, where the line names the kind
 * instead.
 */
export function subjectName(
  groupUid: string,
  filter: AuditFilter,
  groupName: string | undefined,
  names: AuditNames,
): string | null {
  // A ref naming another group reads an empty feed, so it must not be labelled
  // with this group's name.
  if (filter.type === "group") {
    return filter.ref === groupUid ? groupName?.trim() || null : null;
  }

  if (filter.type !== "member" || !filter.ref) return null;

  return names[filter.ref]?.name ?? null;
}
