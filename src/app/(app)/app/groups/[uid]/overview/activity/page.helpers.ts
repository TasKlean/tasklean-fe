/**
 * Naming what a group's trail is about. A ref is an identifier and the backend
 * sends no label with it, so the roster is read once per view: it names the
 * membership rows of every page the reader goes on to load, and it is the only
 * screen a group's trail can borrow a name from.
 */

import type { AuditEntry, AuditNames } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";
import { getGroupMember, listGroupMembers } from "@/lib/groups/members/members";
import { fullName } from "@/lib/users/name/name";

// How many memberships one page may resolve by itself. A page holds 20 rows and
// a departure is rare, so this is a ceiling rather than a budget.
const MISSING_LIMIT = 10;

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
 * for a membership nothing on this page could name, where the line names the
 * kind instead.
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
 * Names the memberships on a page that the roster could not.
 *
 * @param entries The page about to be rendered.
 * @param known The names the roster covered, which are left alone.
 * @returns One entry per membership the roster has no name for, read one at a
 * time: the roster holds active rows only, so this is where a member who has
 * left gets named. Capped, and best effort per ref.
 */
async function missingNames(entries: AuditEntry[], known: AuditNames): Promise<AuditNames> {
  const refs = new Set<string>();

  for (const entry of entries) {
    const ref = entry.entity?.ref;
    if (entry.entity?.type === "GROUP_MEMBER" && ref && !known[ref]) refs.add(ref);
  }

  const names: AuditNames = {};

  await Promise.all(
    [...refs].slice(0, MISSING_LIMIT).map(async (ref) => {
      try {
        const member = await getGroupMember(ref);
        const name = fullName(member.user?.name, member.user?.lastName);
        if (name) names[ref] = { name, userUid: member.user?.uid };
      } catch {
        // A name is decoration, so a ref that will not resolve costs its row
        // the name and nothing else.
      }
    }),
  );

  return names;
}

/**
 * Reads every name one page of the trail can show.
 *
 * @param entries The page about to be rendered.
 * @param roster The names the roster gave, read alongside the page itself.
 * @returns The roster, plus a name per membership it does not hold, so a row
 * names the person whether they are still in the group or not. Never rejects:
 * every read behind it is best effort.
 */
export async function namesForPage(entries: AuditEntry[], roster: AuditNames): Promise<AuditNames> {
  return { ...roster, ...(await missingNames(entries, roster)) };
}
