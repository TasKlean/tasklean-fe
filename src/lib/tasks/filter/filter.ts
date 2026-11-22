/**
 * The task board's query in all three of its vocabularies: read out of the URL,
 * written back into it, and translated for the endpoint that answers it.
 *
 * Two of the endpoint's refusals are headed off here. `assignedToUid` with
 * `unassigned` is a 400, so `who` is one field that becomes one or the other;
 * and an absent status is already the board's to-do list, so the default is
 * written as nothing at all rather than as the pair it stands for.
 */

import type { QueryValue } from "@/lib/api/client/client.types";
import {
  PRIORITY_FOR_TOKEN,
  SORT_FOR_TOKEN,
  STATUS_FOR_STATE,
  TASK_PRIORITIES,
  TASK_SORTS,
  TASK_STATES,
  type FilterAxis,
  type TaskPriorityToken,
  type TaskQuery,
  type TaskSearchParams,
  type TaskSort,
  type TaskState,
  type TaskWho,
} from "@/lib/tasks/filter/filter.types";
import { QUERY_MAX_LENGTH } from "@/lib/validation/rules/rules";

export const DEFAULT_SORT: TaskSort = "due-asc";

// What the endpoint answers when no status is sent, so writing it would be
// writing the default: the board opens on the chores still waiting to be done.
export const DEFAULT_STATES: readonly TaskState[] = ["open"];

export const STATE_OPTIONS: readonly { value: TaskState; label: string }[] = [
  { value: "open", label: "To-Do" },
  { value: "done", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export const PRIORITY_OPTIONS: readonly { value: TaskPriorityToken; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// `short` is what the pill shows, where there is room for one word.
export const SORT_OPTIONS: readonly { value: TaskSort; label: string; short: string }[] = [
  { value: "due-asc", label: "Due soonest", short: "Due" },
  { value: "due-desc", label: "Due latest", short: "Latest" },
  { value: "priority", label: "Highest priority", short: "Priority" },
  { value: "newest", label: "Recently added", short: "Newest" },
  { value: "name", label: "Name A to Z", short: "A to Z" },
];

/** Takes the first value of a search param that may have arrived repeated. */
function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Reads a search param as the list of values it may hold. */
function many(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Reads a label's id, which the URL carries as text.
 *
 * @returns The id, or null for anything that is not a positive whole number.
 */
function labelId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

/**
 * Reads who the board is being narrowed to.
 *
 * @param value The `who` param, which is `me`, `free` or a membership uid.
 */
function whoFrom(value: string): TaskWho {
  if (value === "") return { kind: "anyone" };
  if (value === "me") return { kind: "me" };
  if (value === "free") return { kind: "free" };
  return { kind: "member", memberUid: value };
}

/** Writes a `who` back as the token the URL carries it under. */
function whoToken(who: TaskWho): string | null {
  if (who.kind === "anyone") return null;
  if (who.kind === "member") return who.memberUid;
  return who.kind;
}

/** Whether a status list is the one the endpoint assumes when none is sent. */
function isDefaultStatus(status: readonly TaskState[]): boolean {
  return status.length === 1 && status[0] === "open";
}

/** The membership a `who` names outright, which only one kind does. */
function assignedUid(who: TaskWho): string | null {
  return who.kind === "member" ? who.memberUid : null;
}

/**
 * Narrows a URL's search params into the query the board runs on.
 *
 * @param params What Next handed the page, where every value is caller-chosen.
 * @returns A query with every field present: anything unknown falls back to the
 * widest reading, so a typed URL narrows the board rather than breaking it.
 */
export function taskQuery(params: TaskSearchParams): TaskQuery {
  const askedStates = new Set(many(params.status));
  const states = TASK_STATES.filter((state) => askedStates.has(state));
  const askedPriority = new Set(many(params.priority));
  const page = Number(one(params.page));

  return {
    q: one(params.q).trim().slice(0, QUERY_MAX_LENGTH),
    status: states.length === 0 ? DEFAULT_STATES : states,
    who: whoFrom(one(params.who).trim()),
    categoryId: labelId(one(params.category)),
    tagId: labelId(one(params.tag)),
    priority: TASK_PRIORITIES.filter((token) => askedPriority.has(token)),
    overdue: one(params.overdue) === "1",
    sort: TASK_SORTS.find((known) => known === one(params.sort)) ?? DEFAULT_SORT,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/**
 * Writes a query back as the URL that reproduces it.
 *
 * @returns Only what is not the default, so an untouched board stays at the
 * group's own path and a copied URL carries nothing it does not need.
 */
export function taskQueryParams(query: TaskQuery): URLSearchParams {
  const params = new URLSearchParams();
  const who = whoToken(query.who);

  if (query.q) params.set("q", query.q);
  if (!isDefaultStatus(query.status)) {
    for (const state of query.status) params.append("status", state);
  }
  if (who) params.set("who", who);
  if (query.categoryId !== null) params.set("category", String(query.categoryId));
  if (query.tagId !== null) params.set("tag", String(query.tagId));
  for (const token of query.priority) params.append("priority", token);
  if (query.overdue) params.set("overdue", "1");
  if (query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));

  return params;
}

/**
 * Turns a query into the parameters `GET /api/groups/{uid}/tasks` takes.
 *
 * @param query The board's query.
 * @param myMemberUid The reader's own membership, which is the only thing that
 * can resolve `who=me`. Without one the filter is dropped rather than guessed.
 * @returns Only what narrows or reorders the board. `assignedToUid` and
 * `unassigned` never both appear: the endpoint refuses that pair with a 400.
 */
export function taskApiQuery(
  query: TaskQuery,
  myMemberUid: string | null,
): Record<string, QueryValue> {
  const params: Record<string, QueryValue> = {};

  if (query.q) params.q = query.q;
  if (!isDefaultStatus(query.status)) {
    params.status = query.status.flatMap((state) => [...STATUS_FOR_STATE[state]]);
  }
  if (query.who.kind === "free") {
    params.unassigned = true;
  } else {
    const memberUid = query.who.kind === "me" ? myMemberUid : assignedUid(query.who);
    if (memberUid) params.assignedToUid = memberUid;
  }
  if (query.categoryId !== null) params.categoryId = query.categoryId;
  if (query.tagId !== null) params.tagId = query.tagId;
  if (query.priority.length > 0) {
    params.priority = query.priority.map((token) => PRIORITY_FOR_TOKEN[token]);
  }
  if (query.overdue) params.overdue = true;
  if (query.sort !== DEFAULT_SORT) params.sort = SORT_FOR_TOKEN[query.sort];
  // Zero-based on the wire, one-based everywhere a reader can see it.
  if (query.page > 1) params.page = query.page - 1;

  return params;
}

/**
 * Builds the URL that applies one change to the board's query.
 *
 * @param path The board's own path, with no query of its own.
 * @param query The query on screen.
 * @param change The axes being changed.
 * @returns The path plus whatever is not the default. The page returns to the
 * first unless the change is the page itself: narrowing a board while reading
 * page four otherwise lands on a page the shorter result no longer has.
 */
export function boardHref(path: string, query: TaskQuery, change: Partial<TaskQuery>): string {
  const page = change.page ?? 1;
  const params = taskQueryParams({ ...query, ...change, page });

  return params.size === 0 ? path : `${path}?${params}`;
}

/**
 * Builds the URL that opens one chore over the board it is on.
 *
 * @returns The board's own URL with `?task=` added, so the open chore is a
 * link somebody can send and the back press closes it.
 */
export function openTaskHref(path: string, query: TaskQuery, taskUid: string): string {
  const params = taskQueryParams(query);
  params.set("task", taskUid);

  return `${path}?${params}`;
}

/**
 * The query as the hidden fields a GET form has to carry to preserve it.
 *
 * @returns Every axis but the search itself and the page, which a new search
 * starts over from.
 */
export function carriedFields(query: TaskQuery): { name: string; value: string }[] {
  const params = taskQueryParams({ ...query, q: "", page: 1 });

  return [...params.entries()].map(([name, value]) => ({ name, value }));
}

/**
 * Which axes the query is holding something back on.
 *
 * @returns One flag per axis. The trigger counts them and each of the panel's
 * fields reads its own, opening on arrival only where something is picked.
 */
export function appliedAxes(query: TaskQuery): Record<FilterAxis, boolean> {
  return {
    status: !isDefaultStatus(query.status),
    who: query.who.kind !== "anyone",
    category: query.categoryId !== null,
    tag: query.tagId !== null,
    priority: query.priority.length > 0,
    overdue: query.overdue,
    sort: query.sort !== DEFAULT_SORT,
  };
}

/**
 * How many axes the filter panel is holding something back on.
 *
 * @returns The count the trigger shows. The search is not one of them: it has
 * its own box on the bar, where the reader can already see it.
 */
export function activeFilterCount(query: TaskQuery): number {
  return Object.values(appliedAxes(query)).filter(Boolean).length;
}

/**
 * Says whether a query hides any chore the board could have shown.
 *
 * @returns False for a sort or a page, which move chores about and remove none,
 * so an empty board under either holds no chores at all.
 */
export function narrowsBoard(query: TaskQuery): boolean {
  return (
    query.q !== "" ||
    !isDefaultStatus(query.status) ||
    query.who.kind !== "anyone" ||
    query.categoryId !== null ||
    query.tagId !== null ||
    query.priority.length > 0 ||
    query.overdue
  );
}
