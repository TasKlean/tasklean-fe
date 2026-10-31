/**
 * The row of controls over the group list. The URL is the authority: every
 * control writes the query into the path and the page re-renders from it, which
 * is what makes a filtered list a link somebody can paste. The search box is
 * the one exception, keeping what is typed locally and pushing it once typing
 * stops, because a keystroke cannot be a navigation.
 *
 * Nothing here filters anything. `filterGroups` does that today and a backend
 * taking the same query does it later; this row only says what was asked for.
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { GroupSearch } from "@/components/app/groups/group-filters/group-search";
import { ShowMenu } from "@/components/app/groups/group-filters/show-menu";
import { SortMenu } from "@/components/app/groups/group-filters/sort-menu";
import { groupQueryParams } from "@/lib/groups/filter/filter";
import type { GroupQuery, GroupShow, GroupSort } from "@/lib/groups/filter/filter.types";

type GroupFiltersProps = {
  query: GroupQuery;
};

// Long enough that an ordinary typing pause does not push, short enough that
// the list is never visibly behind the box.
const SETTLE_MS = 300;

/**
 * Builds the URL that reproduces a query.
 *
 * @returns The path alone for a list with nothing asked of it, so an untouched
 * `/app` never grows an empty query string.
 */
function href(pathname: string, query: GroupQuery): string {
  const params = groupQueryParams(query);

  return params.size > 0 ? `${pathname}?${params}` : pathname;
}

/** Renders the search, the role boxes and the order, all of them writing the URL. */
export function GroupFilters({ query }: Readonly<GroupFiltersProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(query.q);
  const [asked, setAsked] = useState(query.q);

  // The URL changing under us wins: a back press, or the clear link on the
  // no-matches card, has to put the box back rather than be pushed over by it.
  // Not while a push of ours is in flight, though: two searches 300ms apart are
  // two navigations, and the earlier payload landing second would rewrite the
  // box with the older text. The flip back to idle re-runs this with whatever
  // URL actually stuck.
  if (query.q !== asked && !pending) {
    setAsked(query.q);
    setText(query.q);
  }

  useEffect(() => {
    if (text === asked) return;

    const timer = setTimeout(() => {
      setAsked(text);
      startTransition(() => {
        router.replace(href(pathname, { ...query, q: text }), { scroll: false });
      });
    }, SETTLE_MS);

    return () => clearTimeout(timer);
  }, [text, asked, query, pathname, router]);

  /**
   * Writes a pressed control into the URL, carrying whatever is in the box.
   *
   * @param changes What the press changed. The search text rides along, so a
   * filter pressed before the typing settled neither loses it nor fights it.
   */
  function commit(changes: Partial<GroupQuery>): void {
    const next: GroupQuery = { ...query, q: text, ...changes };

    setAsked(next.q);
    startTransition(() => {
      router.replace(href(pathname, next), { scroll: false });
    });
  }

  /** Ticks or unticks one side of the list, which never leaves neither on. */
  function toggleShow(value: GroupShow): void {
    const show = query.show.includes(value)
      ? query.show.filter((kept) => kept !== value)
      : [...query.show, value];

    // The last ticked box is disabled, and this is the guard behind it.
    if (show.length === 0) return;

    commit({ show });
  }

  /** Puts the list in a different order. */
  function chooseSort(value: GroupSort): void {
    commit({ sort: value });
  }

  return (
    <div className="gap-space-sm border-border/60 pb-space-md flex flex-col flex-wrap border-b sm:flex-row sm:items-center">
      <GroupSearch value={text} pending={pending} onChange={setText} />

      <div className="gap-space-sm flex sm:ml-auto">
        <ShowMenu show={query.show} onToggle={toggleShow} />
        <SortMenu sort={query.sort} onChoose={chooseSort} />
      </div>
    </div>
  );
}
