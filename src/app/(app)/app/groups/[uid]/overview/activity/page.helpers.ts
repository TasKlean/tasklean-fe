/**
 * Reading a group's trail, and naming what it is about. A ref is an identifier
 * and the backend sends no label with it, so every screen a name could come
 * from is read once per view: the roster with `ALL` so a departure still reads
 * by name, the newest tasks, and the household's categories and tags. A ref
 * none of them holds reads by its kind. The refusals the feed can answer with
 * are routed here too, since two of the three end the render.
 */

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getGroupActivity } from "@/lib/audit/audit";
import type {
  ActorChoice,
  AuditNames,
  AuditPage,
  EntityChoice,
  MemberChoice,
} from "@/lib/audit/audit.types";
import { nameKey } from "@/lib/audit/entity/entity";
import { ENTITY_FOR_TYPE, auditFilterQuery } from "@/lib/audit/filter/filter";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";
import { listGroupMembers } from "@/lib/groups/members/members";
import { getCategories } from "@/lib/labels/categories/categories";
import { getTags } from "@/lib/labels/tags/tags";
import { GROUP_UNAVAILABLE_PATH, isGroupUnavailable } from "@/lib/groups/unavailable/unavailable";
import { SORT_FOR_TOKEN, STATUS_FOR_STATE, TASK_STATES } from "@/lib/tasks/filter/filter.types";
import { getBoard } from "@/lib/tasks/tasks/tasks";
import { fullName } from "@/lib/users/name/name";

/** What one roster read tells a trail: who its rows are about, and who can be picked. */
export type MemberRoster = {
  // Keyed by `nameKey`, which is a row's entity type and its ref together.
  names: AuditNames;
  // The same members in the roster's order, for the control that pins the feed
  // to one membership.
  members: MemberChoice[];
  // The people behind those memberships, for the control that narrows the feed
  // to one person's actions. Shorter than `members` where a membership arrived
  // without the user behind it.
  actors: ActorChoice[];
};

/** What the screens a trail borrows names from can tell it. */
export type TrailSubjects = MemberRoster & {
  // The newest tasks, for the control that pins the feed to one. The read
  // behind it names far more rows than it offers.
  tasks: EntityChoice[];
  categories: EntityChoice[];
  tags: EntityChoice[];
};

/** The first page of a trail, what its rows read by, and why it is not there. */
export type TrailView = {
  page: AuditPage;
  subjects: TrailSubjects;
  // The line shown in the feed's place, null where it loaded.
  failure: string | null;
};

const EMPTY_PAGE: AuditPage = { entries: [], nextCursor: null, total: 0 };

const EMPTY_ROSTER: MemberRoster = { names: {}, members: [], actors: [] };

const EMPTY_SUBJECTS: TrailSubjects = { ...EMPTY_ROSTER, tasks: [], categories: [], tags: [] };

// How many tasks one read names. A trail's rows are a page of 20 and the newest
// activity is mostly about the newest tasks, so a hundred covers a household's
// feed without a read per row: one older than that reads by its uid instead.
const TASK_NAMES = 100;

// How many of those the picker offers, the rest being reachable by the search
// beside them.
const TASKS_OFFERED = 10;

// Every state, because a trail names archived and finished tasks as readily as
// open ones, where the board's own default is the to-do list.
const EVERY_STATE = TASK_STATES.flatMap((state) => [...STATUS_FOR_STATE[state]]);

/**
 * Reads what the roster can tell a trail, in one call.
 *
 * @param groupUid The group in the route.
 * @returns A name per membership, the same members in order, and the people
 * behind them. Read with `ALL`, so a row about somebody who has left still
 * reads by name and both pickers can offer them. All empty where it would not
 * load, and never a rejection.
 */
export async function memberRoster(groupUid: string): Promise<MemberRoster> {
  try {
    const roster = await listGroupMembers(groupUid, "ALL");
    const names: AuditNames = {};
    const members: MemberChoice[] = [];
    const actors: ActorChoice[] = [];

    for (const member of roster) {
      const name = fullName(member.user?.name, member.user?.lastName);
      if (!member.uid || !name) continue;

      const former = member.isActive === false;

      names[nameKey("GROUP_MEMBER", member.uid)] = { name, userUid: member.user?.uid };
      members.push({ ref: member.uid, name, former });
      if (member.user?.uid) actors.push({ ref: member.user.uid, name, former });
    }

    return { names, members, actors };
  } catch {
    // A name is decoration here, so a failed roster read costs the names and
    // the pickers, never the feed.
    return { names: {}, members: [], actors: [] };
  }
}

/**
 * Reads the tasks a trail's rows are about, newest first.
 *
 * @param groupUid The group in the route.
 * @returns A name per task uid, and the newest few as choices. Empty where the
 * read would not load, and never a rejection: a name is decoration here.
 */
export async function taskSubjects(
  groupUid: string,
): Promise<{ names: AuditNames; tasks: EntityChoice[] }> {
  try {
    const board = await getBoard(groupUid, {
      size: TASK_NAMES,
      sort: SORT_FOR_TOKEN.newest,
      status: EVERY_STATE,
    });
    const names: AuditNames = {};
    const tasks: EntityChoice[] = [];

    for (const task of board.items ?? []) {
      if (!task.uid || !task.name) continue;

      names[nameKey("TASK", task.uid)] = { name: task.name };
      if (tasks.length < TASKS_OFFERED) tasks.push({ ref: task.uid, name: task.name });
    }

    return { names, tasks };
  } catch {
    return { names: {}, tasks: [] };
  }
}

/**
 * Finds the tasks a search in the filter's picker matches.
 *
 * @param groupUid The group in the route.
 * @param query What was typed, which the endpoint matches its own way.
 * @returns The same few the picker offers unsearched, so the panel's list never
 * changes length under the box. **Null where the read would not load**, which
 * the panel says: an empty list there would read as a household with no such
 * task, which is a different answer.
 */
export async function searchTasks(groupUid: string, query: string): Promise<EntityChoice[] | null> {
  try {
    const board = await getBoard(groupUid, {
      size: TASKS_OFFERED,
      sort: SORT_FOR_TOKEN.newest,
      status: EVERY_STATE,
      q: query || null,
    });

    return (board.items ?? []).flatMap((task) =>
      task.uid && task.name ? [{ ref: task.uid, name: task.name }] : [],
    );
  } catch {
    return null;
  }
}

/**
 * Reads the household's categories and tags, which a trail names its rows by.
 *
 * @param groupUid The group in the route.
 * @returns A name per numeric id, as a string, since that is what a row's ref
 * carries. Empty where either read would not load.
 */
export async function labelSubjects(
  groupUid: string,
): Promise<{ names: AuditNames; categories: EntityChoice[]; tags: EntityChoice[] }> {
  const names: AuditNames = {};
  const [categories, tags] = await Promise.all([
    getCategories(groupUid).catch(() => []),
    getTags(groupUid).catch(() => []),
  ]);
  const choices = (labels: { id?: number; name?: string }[], type: string): EntityChoice[] => {
    const rows: EntityChoice[] = [];

    for (const label of labels) {
      if (label.id === undefined || !label.name) continue;

      const ref = String(label.id);
      names[nameKey(type, ref)] = { name: label.name };
      rows.push({ ref, name: label.name });
    }

    return rows;
  };

  return {
    names,
    categories: choices(categories, "CATEGORY"),
    tags: choices(tags, "TAG"),
  };
}

/**
 * Reads everything a trail borrows a name from, in one round of calls.
 *
 * @param groupUid The group in the route.
 * @returns The roster, the tasks and the labels, with one name map covering
 * every ref between them.
 */
export async function trailSubjects(groupUid: string): Promise<TrailSubjects> {
  const [roster, tasks, labels] = await Promise.all([
    memberRoster(groupUid),
    taskSubjects(groupUid),
    labelSubjects(groupUid),
  ]);

  return {
    ...roster,
    names: { ...roster.names, ...tasks.names, ...labels.names },
    tasks: tasks.tasks,
    categories: labels.categories,
    tags: labels.tags,
  };
}

/**
 * Resolves what the pinned entity is called.
 *
 * @param groupUid The group in the route.
 * @param filter The filter the URL carried.
 * @param groupName The open group's name, which the shell has already read.
 * @param names The names read for this view.
 * @returns The name, or null for a kind we have no screen to resolve from and
 * for a membership the roster holds no name for, where the pill that pinned it
 * names the kind instead.
 */
export function subjectName(
  groupUid: string,
  filter: AuditFilter,
  groupName: string | undefined,
  names: AuditNames,
): string | null {
  // A ref naming another group reads an empty feed, so it must not be labelled
  // with this group's name.
  if (filter.type === "group") {
    return filter.ref === groupUid ? groupName?.trim() || null : null;
  }

  if (!filter.type || !filter.ref) return null;

  return names[nameKey(ENTITY_FOR_TYPE[filter.type], filter.ref)]?.name ?? null;
}

/**
 * Reads the first page of a trail, with the roster its rows read by.
 *
 * @param groupUid The group in the route.
 * @param filter The filter the URL carried, with an actor the reader may not
 * ask for already cleared.
 * @param timeZone The reader's zone, which the range is read in.
 * @returns The page, what names its rows, and the line to show instead where
 * the feed was refused.
 * @throws A redirect for a dead session or a group that is not the reader's,
 * and anything that is not an `ApiError`.
 */
export async function loadTrail(
  groupUid: string,
  filter: AuditFilter,
  timeZone: string,
): Promise<TrailView> {
  try {
    // Read together: none answers anything about another, and serially the
    // names would add their own round trips to what the reader waits for. Only
    // the feed read can reject, so a failure here is always the feed's.
    const [page, subjects] = await Promise.all([
      getGroupActivity(groupUid, auditFilterQuery(filter, timeZone)),
      trailSubjects(groupUid),
    ]);

    return { page, subjects, failure: null };
  } catch (error) {
    if (isSessionExpiredError(error)) redirect("/login");
    // An actor filter is refused with a 403 carrying no code, so a feed that
    // asked for one must not read that as the group being gone and bounce.
    if (!filter.actor && isGroupUnavailable(error)) redirect(GROUP_UNAVAILABLE_PATH);

    if (!isApiError(error)) throw error;

    return { page: EMPTY_PAGE, subjects: EMPTY_SUBJECTS, failure: error.message };
  }
}
