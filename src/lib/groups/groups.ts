/**
 * The caller's groups: creating one, joining with a code, and reading or
 * changing one they are already in. The two reads are memoised per request,
 * because a layout and the page inside it ask for the same thing and
 * `request()` sends `cache: "no-store"`, so fetch will not dedupe them.
 */

import "server-only";

import { cache } from "react";
import { serverApi } from "@/lib/api/server/server";
import type {
  Group,
  GroupDetailsRequest,
  JoinGroupRequest,
  MyGroup,
} from "@/lib/groups/groups.types";

const GROUPS_PATH = "/api/groups";

/**
 * Orders groups by name, which is the order a list and a switcher both want.
 *
 * @returns A comparator. A group with no readable name sorts last rather than
 * jumping to the top as an empty string.
 */
function byName(left: MyGroup, right: MyGroup): number {
  const leftName = left.name?.trim() ?? "";
  const rightName = right.name?.trim() ?? "";

  if (leftName === rightName) return 0;
  if (!leftName) return 1;
  if (!rightName) return -1;
  return leftName.localeCompare(rightName);
}

/** Builds the path to one group, encoding a uid that came from the URL. */
function groupPath(uid: string, suffix = ""): string {
  return `${GROUPS_PATH}/${encodeURIComponent(uid)}${suffix}`;
}

/**
 * Creates a group, with the caller as its first admin.
 *
 * @returns The new group, carrying its invite code, so sharing it needs no
 * second request.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise,
 * including 400 for a name the backend refused.
 */
export async function createGroup(fields: GroupDetailsRequest): Promise<Group> {
  return serverApi<Group>(GROUPS_PATH, { method: "POST", body: fields });
}

/**
 * Redeems an invite code, which is the whole of the authorization: no
 * invitation record exists and nobody approves the join.
 *
 * @returns The group joined, and the role in it, which is always
 * `GROUP_MEMBER`: rejoining never restores an admin role.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise.
 * A 404 is an unknown or dead code and says which to nobody, 409 is a group the
 * caller is already in, and 429 is the join bucket, which is tighter than the
 * general ones.
 */
export async function joinGroup(inviteCode: string): Promise<MyGroup> {
  const body: JoinGroupRequest = { inviteCode };
  return serverApi<MyGroup>(`${GROUPS_PATH}/join`, { method: "POST", body });
}

/**
 * Lists the groups the caller is an active member of.
 *
 * The backend returns them unordered and never paginates, so they are sorted
 * here, which is where every other ordering in this app lives.
 *
 * @returns Every group, each with the caller's own role, the member count and
 * when they joined.
 * @throws SessionExpiredError when the session is gone or refused.
 */
export const getMyGroups = cache(async (): Promise<MyGroup[]> => {
  const groups = await serverApi<MyGroup[]>(`${GROUPS_PATH}/mine`);

  return Array.isArray(groups) ? [...groups].sort(byName) : [];
});

/**
 * Reads one group.
 *
 * @returns The group, carrying the caller's own `myRole` and the member count,
 * so a screen opened straight from a uid can gate its admin controls on this
 * response alone. `inviteCode` comes with it only for that group's admin.
 * @throws SessionExpiredError when the session is gone. ApiError otherwise,
 * where 403 means the group is not the caller's or does not exist: the backend
 * cannot tell those apart, deliberately, since the alternative lets someone
 * probe for real uids.
 */
export const getGroup = cache(async (uid: string): Promise<Group> => {
  return serverApi<Group>(groupPath(uid));
});

/**
 * Renames a group, or changes its description.
 *
 * @returns The group as the backend now holds it.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise.
 */
export async function updateGroup(uid: string, fields: GroupDetailsRequest): Promise<Group> {
  return serverApi<Group>(groupPath(uid), { method: "PUT", body: fields });
}

/**
 * Issues a new invite code, which kills the previous one immediately.
 *
 * @returns The group with its new code. Anyone mid-join with the old one gets
 * the same 404 as an unknown code.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise.
 */
export async function rotateInviteCode(uid: string): Promise<Group> {
  return serverApi<Group>(groupPath(uid, "/invite-code"), { method: "POST" });
}

/**
 * Soft-deletes a group.
 *
 * The memberships are left alone and a direct read still answers, so nothing
 * may be built on the group disappearing. The backend owes both.
 *
 * @throws SessionExpiredError when the session is gone, ApiError otherwise.
 */
export async function deleteGroup(uid: string): Promise<void> {
  await serverApi<void>(groupPath(uid), { method: "DELETE" });
}
