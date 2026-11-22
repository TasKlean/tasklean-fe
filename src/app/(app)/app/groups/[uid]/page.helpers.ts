/**
 * Reading everything a board draws. Five reads, run together and reported
 * separately: the rows, the roster and the two label lists answer different
 * questions, so a failed label read costs a filter menu rather than the board.
 *
 * The open chore is read by uid rather than picked out of the page, because
 * `?task=` may name one the current filter or page does not hold.
 */

import "server-only";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { listGroupMembers } from "@/lib/groups/members/members";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";
import { getCategories } from "@/lib/labels/categories/categories";
import type { Category } from "@/lib/labels/categories/categories.types";
import { getTags } from "@/lib/labels/tags/tags";
import type { Tag } from "@/lib/labels/tags/tags.types";
import { taskApiQuery } from "@/lib/tasks/filter/filter";
import type { LabelChoice, TaskQuery, WhoChoice } from "@/lib/tasks/filter/filter.types";
import { getBoard, getTask } from "@/lib/tasks/tasks/tasks";
import type { Task, TaskBoard } from "@/lib/tasks/tasks/tasks.types";
import { fullName } from "@/lib/users/name/name";

export type LoadedBoard = {
  board: TaskBoard;
  // The line shown in the board's place, which is the only failure that costs
  // the screen anything a reader came for.
  failure: string | null;
  members: WhoChoice[];
  categories: Category[];
  tags: LabelChoice[];
  // The chore `?task=` named, or null when it named none or named one that is
  // gone: a stale link opens the board rather than an error.
  open: Task | null;
};

/**
 * Runs one read, keeping its failure to itself.
 *
 * @param fallback What this read is worth when it fails, which for everything
 * but the board is an empty list.
 * @throws A redirect for a dead session or a group that is not the reader's,
 * and anything that is not an `ApiError`: neither is one read's problem.
 */
async function quietly<Value>(read: () => Promise<Value>, fallback: Value): Promise<Value> {
  try {
    return await read();
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    if (isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;
    return fallback;
  }
}

/** Reads the board itself, which is the one failure worth reporting. */
async function readBoard(
  groupUid: string,
  query: TaskQuery,
  myMemberUid: string | null,
): Promise<{ board: TaskBoard; failure: string | null }> {
  try {
    return { board: await getBoard(groupUid, taskApiQuery(query, myMemberUid)), failure: null };
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    if (isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;
    return { board: {}, failure: error.message };
  }
}

/** Narrows a roster into the people a filter row can name. */
function whoChoices(
  roster: Awaited<ReturnType<typeof listGroupMembers>>,
  myMemberUid: string | null,
): WhoChoice[] {
  const choices: WhoChoice[] = [];

  for (const member of roster) {
    const name = fullName(member.user?.name, member.user?.lastName);
    if (!member.uid || !name) continue;

    choices.push({
      memberUid: member.uid,
      name,
      former: member.isActive === false,
      self: member.uid === myMemberUid,
    });
  }

  return choices;
}

/** Narrows a tag list into the rows a filter menu names them by. */
function labelChoices(tags: Tag[]): LabelChoice[] {
  const choices: LabelChoice[] = [];

  for (const tag of tags) {
    if (tag.id && tag.name) choices.push({ id: tag.id, name: tag.name, color: tag.color });
  }

  return choices;
}

/**
 * Reads a group's board and everything its controls offer.
 *
 * @param groupUid The group in the route.
 * @param query The board's query, already read out of the URL.
 * @param myMemberUid The reader's own membership, which `who=me` needs.
 * @param openUid The chore `?task=` named, if any.
 */
export async function loadBoard(
  groupUid: string,
  query: TaskQuery,
  myMemberUid: string | null,
  openUid: string,
): Promise<LoadedBoard> {
  const [result, roster, categories, tags, open] = await Promise.all([
    readBoard(groupUid, query, myMemberUid),
    quietly(() => listGroupMembers(groupUid, "ALL"), []),
    quietly(() => getCategories(groupUid), []),
    quietly(() => getTags(groupUid), []),
    openUid ? quietly(() => getTask(openUid), null) : Promise.resolve(null),
  ]);

  return {
    board: result.board,
    failure: result.failure,
    members: whoChoices(roster, myMemberUid),
    categories,
    tags: labelChoices(tags),
    open,
  };
}
