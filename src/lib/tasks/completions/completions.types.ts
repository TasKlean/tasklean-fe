/**
 * What a recorded round of a task looks like on the wire. Nothing is marked
 * required in the spec, so every field is optional here and narrowed where it
 * is read.
 *
 * The response carries the task's own state after the round, which is what
 * lets a press say what it did without reading the task again.
 */

import type { MemberSummary, TaskStatus } from "@/lib/tasks/tasks/tasks.types";

export const TASK_OUTCOMES = ["DONE", "SKIPPED", "MISSED"] as const;

export type TaskOutcome = (typeof TASK_OUTCOMES)[number];

export type CompleteTaskRequest = {
  // How long it actually took. Left out, the backend snapshots the task's own
  // estimate, so a share is never silently zero for a round nobody timed.
  minutes?: number;
  note?: string;
  // Signed against the task, unlike a task's own picture, which is signed
  // against the group.
  photoUid?: string;
};

export type TaskCompletion = {
  id?: number;
  taskUid?: string;
  taskName?: string;
  // The task as it is now that the round is recorded: a repeating one is due
  // again, a one-off is COMPLETED.
  taskStatus?: TaskStatus;
  taskNextDueDate?: string;
  outcome?: TaskOutcome;
  // The round this was: the due date it was recorded against.
  dueDate?: string;
  dateCompleted?: string;
  dateCreated?: string;
  minutes?: number;
  completionNote?: string;
  completionPhotoUid?: string;
  attributedTo?: MemberSummary;
};

// One page of a task's history on the wire. Cursor-paged rather than numbered,
// a daily task recording a round a day.
export type TaskHistoryPageResponse = {
  items?: TaskCompletion[];
  nextCursor?: string;
  total?: number;
};

export type RoundPage = {
  rounds: TaskCompletion[];
  // Null means this page is the last; a full page is not itself a signal.
  nextCursor: string | null;
  // Every round the task has recorded, pages included, which is the count at
  // the foot of the list.
  total: number;
};

export type RoundPageRequest = {
  cursor: string;
};

export type RoundPageResult = { ok: true; page: RoundPage } | { ok: false; message: string };

// One task's Load more, with the task itself already bound to it.
export type RoundPageLoader = (fields: RoundPageRequest) => Promise<RoundPageResult>;
