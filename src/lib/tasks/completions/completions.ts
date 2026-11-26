/**
 * Recording a round of a task. The call is one press and the rules behind it
 * are the backend's: an unassigned task is claimed by whoever records it, a
 * round that is not due yet is refused, and so is a second one.
 */

import "server-only";

import { serverApi } from "@/lib/api/server/server";
import type {
  CompleteTaskRequest,
  RoundPage,
  TaskCompletion,
  TaskHistoryPageResponse,
} from "@/lib/tasks/completions/completions.types";

// Ten rounds a page: a task's history is read inside the panel's own scroll,
// where twenty would bury the press that asks for more.
export const ROUND_PAGE_SIZE = 10;

/**
 * Marks a task done.
 *
 * @param uid The task's own uid, not its group's.
 * @param fields What the round took, which may be nothing at all: the simple
 * press sends an empty body.
 */
export async function completeTask(
  uid: string,
  fields: CompleteTaskRequest = {},
): Promise<TaskCompletion> {
  return serverApi<TaskCompletion>(`/api/tasks/${encodeURIComponent(uid)}/complete`, {
    method: "POST",
    body: fields,
  });
}

/**
 * Reads one page of a task's recorded rounds, newest first.
 *
 * @param uid The task's own uid.
 * @param cursor What the last page handed back, or nothing for the first.
 */
export async function getTaskHistory(uid: string, cursor?: string): Promise<RoundPage> {
  const page = await serverApi<TaskHistoryPageResponse>(
    `/api/tasks/${encodeURIComponent(uid)}/completions`,
    { query: { cursor, limit: ROUND_PAGE_SIZE } },
  );

  return {
    rounds: page.items ?? [],
    nextCursor: page.nextCursor ?? null,
    total: page.total ?? 0,
  };
}

/**
 * Reads one recorded round.
 *
 * @param id The completion's numeric id, which is how this one resource is
 * addressed: a round is not a uid resource.
 */
export async function getCompletion(id: number): Promise<TaskCompletion> {
  return serverApi<TaskCompletion>(`/api/task-completions/${id}`);
}
