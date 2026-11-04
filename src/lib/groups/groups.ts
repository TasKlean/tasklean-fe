/**
 * The caller's groups: creating one, joining with a code, and reading or
 * changing one they are already in. `getMyGroups` and `getGroup` are memoised
 * per request, because a layout and the page inside it ask for the same thing
 * and `request()` sends `cache: "no-store"`, so fetch will not dedupe them.
 */

import "server-only";

import { cache } from "react";
import { serverApi } from "@/lib/api/server/server";
import { groupApiQuery } from "@/lib/groups/filter/filter";
import type { GroupQuery } from "@/lib/groups/filter/filter.types";
import type {
  CreateGroupRequest,
  Group,
  JoinGroupRequest,
  MyGroup,
  UpdateGroupRequest,
} from "@/lib/groups/groups.types";

const GROUPS_PATH = "/api/groups";

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
export async function createGroup(fields: CreateGroupRequest): Promise<Group> {
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
 * Lists every group the caller is an active member of, in name order.
 *
 * Asked for without a query, the endpoint answers ordered by name, so nothing
 * is sorted here: a second ordering on top would fight one the list asked for.
 *
 * @returns Every group, each with the caller's own role, the member count and
 * when they joined.
 * @throws SessionExpiredError when the session is gone or refused.
 */
export const getMyGroups = cache(async (): Promise<MyGroup[]> => {
  const groups = await serverApi<MyGroup[]>(`${GROUPS_PATH}/mine`);

  return Array.isArray(groups) ? groups : [];
});

/**
 * Lists the caller's groups, narrowed and ordered by what the list asked for.
 *
 * Not memoised, unlike the two reads above: one page calls it, and `cache()`
 * keys on argument identity, so a fresh query object would never hit it anyway.
 *
 * @param query Already normalised by `groupQuery`, which matters: the endpoint
 * answers a role or a sort it does not know with a 400, not with a fallback.
 * @returns The groups that match, in the order asked for.
 * @throws SessionExpiredError when the session is gone or refused.
 */
export async function searchMyGroups(query: GroupQuery): Promise<MyGroup[]> {
  const params = groupApiQuery(query);

  // A list with nothing asked of it is the one the chrome's switcher already
  // read, so the page shares that call rather than making an identical second.
  if (Object.keys(params).length === 0) return getMyGroups();

  const groups = await serverApi<MyGroup[]>(`${GROUPS_PATH}/mine`, { query: params });

  return Array.isArray(groups) ? groups : [];
}

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
 * Saves a group's name, description and picture.
 *
 * @param fields Everything the group will then hold: the backend replaces the
 * lot, so an omitted `photoUid` takes the picture away.
 * @returns The group as the backend now holds it.
 * @throws SessionExpiredError when the session is gone, ApiError otherwise. A
 * 400 is an upload that cannot be attached, as well as a refused name.
 */
export async function updateGroup(uid: string, fields: UpdateGroupRequest): Promise<Group> {
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
