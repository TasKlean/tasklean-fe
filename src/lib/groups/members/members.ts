/**
 * A group's roster, and the two things an admin does to it. The list is read
 * from a group route and the changes are made on membership routes, but all
 * three are about memberships, so they live together.
 */

import "server-only";

import { serverApi } from "@/lib/api/server/server";
import type { GroupMember, MemberRoleRequest, MembershipStatus } from "@/lib/groups/groups.types";
import { isGroupAdmin } from "@/lib/groups/role/role";

const MEMBERS_PATH = "/api/group-members";

/** Builds the path to one membership, encoding a uid that came from the URL. */
function memberPath(uid: string, suffix = ""): string {
  return `${MEMBERS_PATH}/${encodeURIComponent(uid)}${suffix}`;
}

/**
 * Orders a roster with the people still in the group first, then the admins,
 * then by name.
 *
 * @returns A comparator. A member with no readable name sorts last within its
 * own tier rather than jumping to the top as an empty string.
 */
function rosterOrder(left: GroupMember, right: GroupMember): number {
  // Absent counts as still here: only a read that asked for the people who
  // have left has any row with the flag off.
  const leftHere = left.isActive !== false;
  if (leftHere !== (right.isActive !== false)) return leftHere ? -1 : 1;

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
 * Lists a group's members, by default the people currently in it.
 *
 * @param groupUid The group in the route.
 * @param status Which memberships to ask for. `ALL` reaches everyone who was
 * ever in the group, as one row per person: rejoining revives the row rather
 * than adding a second, so nothing has to be de-duplicated.
 * @returns Every membership the status covers, each carrying the user behind
 * it, which is enough to render the roster from this one call. Sorted here
 * because the endpoint answers in no particular order.
 * @throws SessionExpiredError when the session is gone. ApiError otherwise,
 * where 403 means the group is not the caller's or does not exist alike.
 */
export async function listGroupMembers(
  groupUid: string,
  status?: MembershipStatus,
): Promise<GroupMember[]> {
  const members = await serverApi<GroupMember[]>(
    `/api/groups/${encodeURIComponent(groupUid)}/members`,
    { query: { status } },
  );

  return Array.isArray(members) ? [...members].sort(rosterOrder) : [];
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
