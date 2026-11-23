/**
 * Who may change one chore. A third permission model: a group's settings go by
 * role and a label's presses go by control, but a task is its author's, with an
 * admin able to tidy up after a member who has lost interest in it.
 *
 * UX only. Spring is the authority, so every press still handles its own 403.
 */

import { isGroupAdmin } from "@/lib/groups/role/role";
import type { Task } from "@/lib/tasks/tasks/tasks.types";

/**
 * Whether the reader may edit, archive or delete this chore.
 *
 * @param task The chore, whose `createdBy` names the author's membership.
 * @param myMemberUid The reader's own membership in this group, which rides on
 * the group read rather than costing a roster call.
 * @param myRole The reader's role in the group.
 * @returns True for the author and for any admin. A chore whose author the
 * response did not name is nobody's but an admin's, since there is nothing to
 * match the reader against.
 */
export function canEditTask(
  task: Task,
  myMemberUid: string | null,
  myRole: string | undefined,
): boolean {
  if (isGroupAdmin(myRole)) return true;

  const author = task.createdBy?.memberUid;
  return Boolean(author && myMemberUid && author === myMemberUid);
}

/**
 * Whether the chore is waiting for somebody to take it.
 *
 * @returns True only for a chore nobody holds, which is the one a member may
 * claim without the right to hand it to anybody.
 */
export function isUnclaimed(task: Task): boolean {
  return !task.assignedTo?.memberUid;
}
