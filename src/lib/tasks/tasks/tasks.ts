/**
 * The task endpoints. The board is scoped by the group's uid in the path, a
 * single task by its own uid, and both answer the envelope every call does.
 *
 * A board read is never memoised: the rows a caller may act on depend on who
 * they are, so a cache keyed on the URL would leak between accounts.
 */

import "server-only";

import type { QueryValue } from "@/lib/api/client/client.types";
import { serverApi } from "@/lib/api/server/server";
import type {
  Task,
  TaskBoard,
  TaskCreateRequest,
  TaskWriteRequest,
} from "@/lib/tasks/tasks/tasks.types";

/**
 * Reads one page of a group's board.
 *
 * @param groupUid The group whose tasks these are, which scopes the path.
 * @param query The narrowing and ordering, already in the endpoint's own
 * vocabulary: `taskApiQuery` is the one place our tokens become these.
 */
export async function getBoard(
  groupUid: string,
  query: Record<string, QueryValue> = {},
): Promise<TaskBoard> {
  return serverApi<TaskBoard>(`/api/groups/${encodeURIComponent(groupUid)}/tasks`, { query });
}

/**
 * Reads one task in full.
 *
 * @param uid The task's own uid, not its group's.
 */
export async function getTask(uid: string): Promise<Task> {
  return serverApi<Task>(`/api/tasks/${encodeURIComponent(uid)}`);
}

/**
 * Creates a task, authored by the caller.
 *
 * @param fields The task as it will be, including the group it belongs to.
 */
export async function createTask(fields: TaskCreateRequest): Promise<Task> {
  return serverApi<Task>("/api/tasks", { method: "POST", body: fields });
}

/**
 * Saves a task, replacing it.
 *
 * @param uid The task's own uid.
 * @param fields The task as it will then be: an omitted field is cleared, so
 * a save carries everything it is keeping.
 */
export async function updateTask(uid: string, fields: TaskWriteRequest): Promise<Task> {
  return serverApi<Task>(`/api/tasks/${encodeURIComponent(uid)}`, { method: "PUT", body: fields });
}

/**
 * Retires a task, which cannot be undone: there is no unarchive, and the save
 * above carries no status, so nothing brings one back.
 *
 * @param uid The task's own uid.
 */
export async function archiveTask(uid: string): Promise<Task> {
  return serverApi<Task>(`/api/tasks/${encodeURIComponent(uid)}/archive`, { method: "POST" });
}

/**
 * Deletes a task, which releases its photo and takes its rounds off a share.
 *
 * @param uid The task's own uid.
 */
export async function deleteTask(uid: string): Promise<void> {
  await serverApi<void>(`/api/tasks/${encodeURIComponent(uid)}`, { method: "DELETE" });
}
