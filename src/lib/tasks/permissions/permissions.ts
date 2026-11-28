/**
 * Who may change one task. A third permission model: a group's settings go by
 * role and a label's presses go by control, but a task is its author's, with an
 * admin able to tidy up after a member who has lost interest in it.
 *
 * UX only. Spring is the authority, so every press still handles its own 403.
 */

import { isGroupAdmin } from "@/lib/groups/role/role";
import { canRecordRound } from "@/lib/tasks/completions/completions.helpers";
import type { Task } from "@/lib/tasks/tasks/tasks.types";

/**
 * Whether the reader may edit, archive or delete this task.
 *
 * @param task The task, whose `createdBy` names the author's membership.
 * @param myMemberUid The reader's own membership in this group, which rides on
 * the group read rather than costing a roster call.
 * @param myRole The reader's role in the group.
 * @returns True for the author and for any admin. A task whose author the
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
 * Whether the reader may retire this task.
 *
 * @returns True for the author and for any admin, and only while the task is
 * not archived already: a second archive answers 200 and writes nothing, so
 * the press would do nothing visible.
 */
export function canArchiveTask(
  task: Task,
  myMemberUid: string | null,
  myRole: string | undefined,
): boolean {
  return task.status !== "ARCHIVED" && canEditTask(task, myMemberUid, myRole);
}

/**
 * Whether the task is somebody else's to record a round on.
 *
 * @returns True only where it is assigned to another member. An unassigned
 * task is anybody's, recording a round claiming it, and an admin is no
 * exception here: the endpoint refuses anybody but the assignee, whatever their
 * role, which is why this question is not `canEditTask`.
 */
export function assignedElsewhere(task: Task, myMemberUid: string | null): boolean {
  const assignee = task.assignedTo?.memberUid;

  return Boolean(assignee) && assignee !== myMemberUid;
}

/**
 * Whether the task is waiting for somebody to take it.
 *
 * @returns True only for a task nobody holds, which is the one a member may
 * claim without the right to hand it to anybody.
 */
export function isUnclaimed(task: Task): boolean {
  return !task.assignedTo?.memberUid;
}

/**
 * Whether the reader may take this task.
 *
 * @returns True for a task nobody holds that still has a round left. The
 * endpoint itself guards neither, so a finished or archived task with no
 * assignee would be claimed as readily as a live one.
 */
export function canClaimTask(task: Task): boolean {
  return isUnclaimed(task) && canRecordRound(task);
}
