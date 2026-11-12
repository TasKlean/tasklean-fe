/**
 * Reading a group's trail, and naming what it is about. A ref is an identifier
 * and the backend sends no label with it, so the roster is read once per view,
 * for everyone who was ever in the group: it names the membership rows of every
 * page the reader goes on to load, and it is the only screen a group's trail can
 * borrow a name from. The refusals the feed can answer with are routed here too,
 * since two of the three end the render.
 */

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getGroupActivity } from "@/lib/audit/audit";
import type { ActorChoice, AuditNames, AuditPage, MemberChoice } from "@/lib/audit/audit.types";
import { auditFilterQuery } from "@/lib/audit/filter/filter";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";
import { listGroupMembers } from "@/lib/groups/members/members";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";
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

/** The first page of a trail, what its rows read by, and why it is not there. */
export type TrailView = {
  page: AuditPage;
  roster: MemberRoster;
  // The line shown in the feed's place, null where it loaded.
  failure: string | null;
};

const EMPTY_PAGE: AuditPage = { entries: [], nextCursor: null, total: 0 };

const EMPTY_ROSTER: MemberRoster = { names: {}, members: [], actors: [] };

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
 * for a membership the roster holds no name for, where the pill that pinned it
 * names the kind instead.
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

/**
 * Reads the first page of a trail, with the roster its rows read by.
 *
 * @param groupUid The group in the route.
 * @param filter The filter the URL carried, with an actor the reader may not
 * ask for already cleared.
 * @param timeZone The reader's zone, which the range is read in.
 * @returns The page, the roster, and the line to show instead where the feed
 * was refused.
 * @throws A redirect for a dead session or a group that is not the reader's,
 * and anything that is not an `ApiError`.
 */
export async function loadTrail(
  groupUid: string,
  filter: AuditFilter,
  timeZone: string,
): Promise<TrailView> {
  try {
    // Read together: neither answers anything about the other, and serially the
    // roster would add its own round trip to what the reader waits for. Only
    // the feed read can reject, so a failure here is always the feed's.
    const [page, roster] = await Promise.all([
      getGroupActivity(groupUid, auditFilterQuery(filter, timeZone)),
      memberRoster(groupUid),
    ]);

    return { page, roster, failure: null };
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    // An actor filter is refused with a 403 carrying no code, so a feed that
    // asked for one must not read that as the group being gone and bounce.
    if (!filter.actor && isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;

    return { page: EMPTY_PAGE, roster: EMPTY_ROSTER, failure: error.message };
  }
}
