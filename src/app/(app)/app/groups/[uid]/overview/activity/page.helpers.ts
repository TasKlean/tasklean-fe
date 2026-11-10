/**
 * Naming what a group's trail is about. A ref is an identifier and the backend
 * sends no label with it, so the roster is read once per view, for everyone who
 * was ever in the group: it names the membership rows of every page the reader
 * goes on to load, and it is the only screen a group's trail can borrow a name
 * from.
 */

import type { ActorChoice, AuditNames, MemberChoice } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";
import { listGroupMembers } from "@/lib/groups/members/members";
import { fullName } from "@/lib/users/name/name";

/** What one roster read tells a trail: who its rows are about, and who can be picked. */
export type MemberRoster = {
  // Keyed by the ref a row carries, for the line it reads.
  names: AuditNames;
  // The same members in the roster's order, for the control that pins the feed
  // to one membership.
  members: MemberChoice[];
  // The people behind those memberships, for the control that narrows the feed
  // to one person's actions. Shorter than `members` where a membership arrived
  // without the user behind it.
  actors: ActorChoice[];
};

/**
 * Reads what the roster can tell a trail, in one call.
 *
 * @param groupUid The group in the route.
 * @returns A name per membership, the same members in order, and the people
 * behind them. Read with `ALL`, so a row about somebody who has left still
 * reads by name and both pickers can offer them. All empty where it would not
 * load, and never a rejection.
 */
export async function memberRoster(groupUid: string): Promise<MemberRoster> {
  try {
    const roster = await listGroupMembers(groupUid, "ALL");
    const names: AuditNames = {};
    const members: MemberChoice[] = [];
    const actors: ActorChoice[] = [];

    for (const member of roster) {
      const name = fullName(member.user?.name, member.user?.lastName);
      if (!member.uid || !name) continue;

      const former = member.isActive === false;

      names[member.uid] = { name, userUid: member.user?.uid };
      members.push({ ref: member.uid, name, former });
      if (member.user?.uid) actors.push({ ref: member.user.uid, name, former });
    }

    return { names, members, actors };
  } catch {
    // A name is decoration here, so a failed roster read costs the names and
    // the pickers, never the feed.
    return { names: {}, members: [], actors: [] };
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
 * for a membership the roster holds no name for, where the line names the kind
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
