/**
 * Naming the one entity a filtered trail is pinned to. A ref is an identifier
 * rather than a label, and only the roster can turn a membership's into a
 * person's name, so this is the one read the filter adds.
 */

import type { AuditFilter } from "@/lib/audit/filter/filter.types";
import { listGroupMembers } from "@/lib/groups/members/members";
import { fullName } from "@/lib/users/name/name";

/**
 * Resolves what the pinned entity is called.
 *
 * @param groupUid The group in the route.
 * @param filter The filter the URL carried.
 * @param groupName The open group's name, which the shell has already read.
 * @returns The name, or null for a kind we have no screen to resolve from and
 * for a membership the roster no longer holds, where the line names the kind
 * instead.
 */
export async function subjectName(
  groupUid: string,
  filter: AuditFilter,
  groupName: string | undefined,
): Promise<string | null> {
  // A ref naming another group reads an empty feed, so it must not be labelled
  // with this group's name.
  if (filter.type === "group") {
    return filter.ref === groupUid ? (groupName?.trim() ?? null) : null;
  }

  if (filter.type !== "member" || !filter.ref) return null;

  try {
    const members = await listGroupMembers(groupUid);
    const member = members.find((candidate) => candidate.uid === filter.ref);

    return fullName(member?.user?.name, member?.user?.lastName) ?? null;
  } catch {
    // A name is decoration here, so a failed roster read costs the name only.
    return null;
  }
}
