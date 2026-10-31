/**
 * The group list's query: what the URL asks for. The shape is what a backend
 * filter would take as parameters, so the single call site that applies it to
 * the list we already hold can be swapped for a call that sends it.
 *
 * No `server-only`: the row of controls reads this in the browser.
 */

export const GROUP_SORTS = [
  "name-asc",
  "name-desc",
  "joined-desc",
  "created-desc",
  "members-desc",
] as const;

export type GroupSort = (typeof GROUP_SORTS)[number];

// Which side of the list's own split a group falls on, which is the only role
// distinction the list draws: you administer a group or you do not.
export const GROUP_SHOWS = ["admin", "member"] as const;

export type GroupShow = (typeof GROUP_SHOWS)[number];

export type GroupQuery = {
  // Trimmed, capped, and matched against a group's name and description.
  q: string;
  // Never empty: both sides is the default, and one side is the only
  // restriction there is, since the last ticked box cannot be unticked.
  show: readonly GroupShow[];
  sort: GroupSort;
};

// What Next hands a page as `searchParams`, which is caller-controlled: a key
// repeated in the URL arrives as a list, and anything may be missing.
export type GroupSearchParams = Record<string, string | string[] | undefined>;
