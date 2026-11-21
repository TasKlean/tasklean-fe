/**
 * The task board's query in the URL's own vocabulary: short lowercase tokens,
 * so a filtered board is a link that reads as a sentence. `taskApiQuery` maps
 * them to the endpoint's enums, which are nothing like them.
 *
 * No `server-only`: the row of controls reads this in the browser.
 */

import type { TaskPriority, TaskStatus } from "@/lib/tasks/tasks/tasks.types";

// Three, not four. `IN_PROGRESS` exists in the column's constraint and nothing
// ever sets it, so "open" is the pair the backend itself calls OPEN.
export const TASK_STATES = ["open", "done", "archived"] as const;

export type TaskState = (typeof TASK_STATES)[number];

export const TASK_PRIORITIES = ["high", "medium", "low"] as const;

export type TaskPriorityToken = (typeof TASK_PRIORITIES)[number];

export const TASK_SORTS = ["due-asc", "due-desc", "priority", "newest", "name"] as const;

export type TaskSort = (typeof TASK_SORTS)[number];

// Who a chore is for. `me` and `free` are the two the board answers without
// naming anybody; anything else is a membership uid typed into the URL.
export type TaskWho =
  { kind: "anyone" } | { kind: "me" } | { kind: "free" } | { kind: "member"; memberUid: string };

export type TaskQuery = {
  // Trimmed and capped, matched against a chore's name and description.
  q: string;
  // Never empty: `["open"]` is the default, which is also what the endpoint
  // answers when no status is sent at all.
  status: readonly TaskState[];
  who: TaskWho;
  // Numeric ids, which is how a label is addressed everywhere but its list.
  categoryId: number | null;
  tagId: number | null;
  priority: readonly TaskPriorityToken[];
  overdue: boolean;
  sort: TaskSort;
  // One-based, the way a reader counts. The wire counts from zero.
  page: number;
};

export const STATUS_FOR_STATE: Record<TaskState, readonly TaskStatus[]> = {
  open: ["TODO", "IN_PROGRESS"],
  done: ["COMPLETED"],
  archived: ["ARCHIVED"],
};

export const PRIORITY_FOR_TOKEN: Record<TaskPriorityToken, TaskPriority> = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

export const SORT_FOR_TOKEN: Record<TaskSort, string> = {
  "due-asc": "DUE_ASC",
  "due-desc": "DUE_DESC",
  priority: "PRIORITY_HIGH_FIRST",
  newest: "CREATED_DESC",
  name: "NAME_ASC",
};

// What Next hands a page as `searchParams`, which is caller-controlled: a key
// repeated in the URL arrives as a list, and anything may be missing.
export type TaskSearchParams = Record<string, string | string[] | undefined>;
