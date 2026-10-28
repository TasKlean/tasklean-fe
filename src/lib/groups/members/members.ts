/**
 * A group's roster, and the two things an admin does to it. The list is read
 * from a group route and the changes are made on membership routes, but all
 * three are about memberships, so they live together.
 */

import "server-only";

import { serverApi } from "@/lib/api/server/server";
import type { GroupMember, MemberRoleRequest } from "@/lib/groups/groups.types";
import { isGroupAdmin } from "@/lib/groups/role/role";

const MEMBERS_PATH = "/api/group-members";

/** Builds the path to one membership, encoding a uid that came from the URL. */
function memberPath(uid: string, suffix = ""): string {
  return `${MEMBERS_PATH}/${encodeURIComponent(uid)}${suffix}`;
}

/**
 * Orders a roster with the admins first, then by name.
 *
 * @returns A comparator. A member with no readable name sorts last within its
 * own group rather than jumping to the top as an empty string.
 */
function byRoleThenName(left: GroupMember, right: GroupMember): number {
  const leftAdmin = isGroupAdmin(left.role);
  if (leftAdmin !== isGroupAdmin(right.role)) return leftAdmin ? -1 : 1;

  const leftName = left.user?.name?.trim() ?? "";
  const rightName = right.user?.name?.trim() ?? "";

  if (leftName === rightName) return 0;
  if (!leftName) return 1;
  if (!rightName) return -1;
  return leftName.localeCompare(rightName);
}

/**
 * Lists a group's active members.
 *
 * @returns Every membership, each carrying the user behind it, which is enough
 * to render the roster from this one call.
 * @throws SessionExpiredError when the session is gone. ApiError otherwise,
 * where 403 means the group is not the caller's or does not exist alike.
 */
export async function listGroupMembers(groupUid: string): Promise<GroupMember[]> {
  const members = await serverApi<GroupMember[]>(
    `/api/groups/${encodeURIComponent(groupUid)}/members`,
  );

  return Array.isArray(members) ? [...members].sort(byRoleThenName) : [];
}

/**
 * Changes a member's role in their group.
 *
 * @returns The membership as the backend now holds it.
 * @throws SessionExpiredError when the session is gone. ApiError otherwise,
 * where 409 is the last-admin guard: a group must keep at least one.
 */
export async function changeMemberRole(
  memberUid: string,
  role: MemberRoleRequest["role"],
): Promise<GroupMember> {
  const body: MemberRoleRequest = { role };
  return serverApi<GroupMember>(memberPath(memberUid, "/role"), { method: "PATCH", body });
}

/**
 * Ends a membership, which is both "remove a member" and "leave the group".
 *
 * The backend works out which happened by comparing the caller to the
 * membership's user, so the two differ only in whose uid is sent. The row is
 * soft-deleted either way, so history and audit attribution survive.
 *
 * @throws SessionExpiredError when the session is gone. ApiError otherwise,
 * where 409 is the last-admin guard, which fires for a sole admin leaving too.
 */
export async function removeMember(memberUid: string): Promise<void> {
  await serverApi<void>(memberPath(memberUid), { method: "DELETE" });
}
