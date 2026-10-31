/**
 * Searching, narrowing and ordering the group list in the copy we already hold.
 * `filterGroups` is the one call site a backend filter replaces: the rest of
 * this module reads the query out of the URL and writes it back, which stays
 * true either way.
 *
 * The backend has no filter at all today, so no endpoint takes any of this.
 */

import {
  GROUP_SHOWS,
  GROUP_SORTS,
  type GroupQuery,
  type GroupSearchParams,
  type GroupShow,
  type GroupSort,
} from "@/lib/groups/filter/filter.types";
import type { MyGroup } from "@/lib/groups/groups.types";
import { groupLabel } from "@/lib/groups/labels/labels";
import { isGroupAdmin } from "@/lib/groups/role/role";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";

// A search longer than this is somebody pasting, not searching, and the value
// goes back into a URL.
const QUERY_MAX_LENGTH = 100;

export const DEFAULT_SORT: GroupSort = "name-asc";

// `short` is what the pill shows, where there is room for one word: the full
// label names the order in the panel, where the choice is actually made.
export const SORT_OPTIONS: readonly { value: GroupSort; label: string; short: string }[] = [
  { value: "name-asc", label: "Name A to Z", short: "A to Z" },
  { value: "name-desc", label: "Name Z to A", short: "Z to A" },
  { value: "joined-desc", label: "Recently joined", short: "Joined" },
  { value: "created-desc", label: "Newest group", short: "Newest" },
  { value: "members-desc", label: "Most members", short: "Members" },
];

// The same words the two bands carry, so a box and the heading it hides name
// the same thing.
export const SHOW_OPTIONS: readonly { value: GroupShow; label: string }[] = [
  { value: "admin", label: "Groups you manage" },
  { value: "member", label: "Groups you're in" },
];

/** Orders two groups by the name the list shows for them. */
function byName(first: MyGroup, second: MyGroup): number {
  return groupLabel(first.name).localeCompare(groupLabel(second.name), "en", {
    sensitivity: "base",
  });
}

/**
 * Reads an API timestamp as a number to compare.
 *
 * @returns The time, or 0 for a field the backend did not send, which sorts it
 * last under every ordering here.
 */
function at(value: string | undefined): number {
  return parseApiDateOrNull(value)?.getTime() ?? 0;
}

// Name is every ordering's tiebreak, so a list of groups that joined on the
// same day does not shuffle between renders.
const COMPARATORS: Record<GroupSort, (first: MyGroup, second: MyGroup) => number> = {
  "name-asc": byName,
  "name-desc": (first, second) => -byName(first, second),
  "joined-desc": (first, second) =>
    at(second.dateJoined) - at(first.dateJoined) || byName(first, second),
  "created-desc": (first, second) =>
    at(second.dateCreated) - at(first.dateCreated) || byName(first, second),
  "members-desc": (first, second) =>
    (second.memberCount ?? 0) - (first.memberCount ?? 0) || byName(first, second),
};

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
 * Narrows a URL's search params into the query the list runs on.
 *
 * @param params What Next handed the page, where every value is caller-chosen.
 * @returns A query with every field present: an unknown sort, a role that is
 * not one of ours and a missing value all fall back to showing everything.
 */
export function groupQuery(params: GroupSearchParams): GroupQuery {
  const q = one(params.q).trim().slice(0, QUERY_MAX_LENGTH);
  const asked = new Set(many(params.show));
  const show = GROUP_SHOWS.filter((side) => asked.has(side));
  const sort = GROUP_SORTS.find((known) => known === one(params.sort)) ?? DEFAULT_SORT;

  // Both sides is the default, so a URL asking for neither, for both or for
  // something that is not a side of this list at all means the whole list.
  return { q, show: show.length === 0 ? GROUP_SHOWS : show, sort };
}

/** Says whether a group is on a side of the list the query asked for. */
function shows(group: MyGroup, show: readonly GroupShow[]): boolean {
  return show.includes(isGroupAdmin(group.myRole) ? "admin" : "member");
}

/** Says whether a group's name or description holds the search text. */
function matches(group: MyGroup, needle: string): boolean {
  if (!needle) return true;

  return `${group.name ?? ""} ${group.description ?? ""}`.toLocaleLowerCase().includes(needle);
}

/**
 * Applies a query to the groups we hold.
 *
 * This is the function a backend filter replaces: everything it does, a `GET`
 * carrying the same query would answer with.
 *
 * @returns A new list, narrowed and ordered. The input is left alone, since
 * `sort` would otherwise reorder the caller's array.
 */
export function filterGroups(groups: readonly MyGroup[], query: GroupQuery): MyGroup[] {
  const needle = query.q.toLocaleLowerCase();

  return groups
    .filter((group) => shows(group, query.show) && matches(group, needle))
    .sort(COMPARATORS[query.sort]);
}

/**
 * Writes a query back as the URL that reproduces it.
 *
 * @returns Only what is not the default, so an untouched list stays at `/app`
 * and a copied URL carries nothing it does not need.
 */
export function groupQueryParams(query: GroupQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  // Only a restriction is written: both sides is what no `show` at all means.
  if (query.show.length < GROUP_SHOWS.length) {
    for (const show of query.show) params.append("show", show);
  }
  if (query.sort !== DEFAULT_SORT) params.set("sort", query.sort);

  return params;
}
