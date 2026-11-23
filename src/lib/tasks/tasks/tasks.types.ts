/**
 * The task endpoints' wire shapes. Nothing is marked required in the spec, so
 * every field a response carries is optional here and narrowed where it is
 * read. Types only, so nothing of it reaches a bundle and `server-only` would
 * refuse a reader that is perfectly safe.
 */

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITY_VALUES = ["HIGH", "MEDIUM", "LOW"] as const;

export type TaskPriority = (typeof TASK_PRIORITY_VALUES)[number];

// `CUSTOM` is in the backend's enum and refused by it ("a custom recurrence is
// not supported yet"), so nothing of ours offers it.
export const RECURRENCE_TYPES = ["DAILY", "WEEKLY", "MONTHLY"] as const;

export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

// A membership, not a user: `memberUid` is the id namespace every task field
// addressing a person uses.
export type MemberSummary = {
  memberUid?: string;
  name?: string;
  lastName?: string;
  photoUid?: string;
  photoUrl?: string;
};

export type TaskTag = {
  id?: number;
  name?: string;
  color?: string;
};

export type Task = {
  uid?: string;
  groupUid?: string;
  name?: string;
  description?: string;
  photoUid?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  recurrenceType?: string;
  // UTC with no zone marker, like every other timestamp the API answers with.
  nextDueDate?: string;
  dateCompleted?: string;
  dateCreated?: string;
  dateUpdated?: string;
  // The backend's own verdict, worked out against its clock rather than ours.
  overdue?: boolean;
  requiresPhotoProof?: boolean;
  estimatedTimeMinutes?: number;
  categoryId?: number;
  assignedTo?: MemberSummary;
  createdBy?: MemberSummary;
  tags?: TaskTag[];
};

export type TaskBoard = {
  items?: Task[];
  // Zero-based, unlike the page a reader is shown.
  page?: number;
  size?: number;
  totalPages?: number;
  totalTasks?: number;
};

export type TaskWriteRequest = {
  name: string;
  priority?: TaskPriority;
  description?: string;
  categoryId?: number;
  tagNames?: string[];
  assignedToUid?: string;
  // Carries an offset, unlike every other date we write: the request binds to
  // an `OffsetDateTime` where the response answers with a naive one.
  nextDueDate?: string;
  recurrenceType?: RecurrenceType;
  requiresPhotoProof?: boolean;
  estimatedTimeMinutes?: number;
  photoUid?: string;
};

export type TaskCreateRequest = TaskWriteRequest & { groupUid: string };
