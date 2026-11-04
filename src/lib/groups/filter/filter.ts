/**
 * The group list's query in all three of its vocabularies: read out of the URL,
 * written back into it, and translated for the endpoint that answers it.
 *
 * Nothing here narrows or orders anything. The backend does both now, so the
 * URL's own tokens and its enums are kept in step by hand, under a test each.
 */

import type { QueryValue } from "@/lib/api/client/client.types";
import {
  GROUP_SHOWS,
  GROUP_SORTS,
  type GroupQuery,
  type GroupSearchParams,
  type GroupShow,
  type GroupSort,
} from "@/lib/groups/filter/filter.types";
import type { GroupRole } from "@/lib/groups/groups.types";

// `FieldLimits.SEARCH_TEXT` on the backend, which refuses a longer search as a
// 400: this cap is what keeps a pasted one from ever becoming one.
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

// The backend's own vocabulary, which the URL's is not. A role is checked
// against the contract's own type; a sort is a bare string, hence its test.
const ROLE_FOR_SHOW: Record<GroupShow, GroupRole> = {
  admin: "GROUP_ADMIN",
  member: "GROUP_MEMBER",
};

const SORT_FOR_TOKEN: Record<GroupSort, string> = {
  "name-asc": "NAME_ASC",
  "name-desc": "NAME_DESC",
  "joined-desc": "JOINED_DESC",
  "created-desc": "CREATED_DESC",
  "members-desc": "MEMBERS_DESC",
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

/**
 * Turns a query into the parameters `GET /api/groups/mine` takes.
 *
 * @returns Only what narrows or reorders the list, the same way the URL carries
 * only that: naming both roles and naming none are the same request, and name
 * order is what the endpoint answers with when no sort is named at all.
 */
export function groupApiQuery(query: GroupQuery): Record<string, QueryValue> {
  const params: Record<string, QueryValue> = {};

  if (query.q) params.q = query.q;
  if (query.show.length < GROUP_SHOWS.length) {
    params.role = query.show.map((show) => ROLE_FOR_SHOW[show]);
  }
  if (query.sort !== DEFAULT_SORT) params.sort = SORT_FOR_TOKEN[query.sort];

  return params;
}

/**
 * Says whether a query hides any group it could have shown.
 *
 * @returns True for a search or a role box, false for an order: a sort moves
 * groups about and removes none, so an empty list under one holds no groups at
 * all, which is a different thing to say.
 */
export function narrowsList(query: GroupQuery): boolean {
  return query.q !== "" || query.show.length < GROUP_SHOWS.length;
}
