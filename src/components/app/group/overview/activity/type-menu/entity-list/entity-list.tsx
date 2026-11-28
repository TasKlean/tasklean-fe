/**
 * The things of one kind a trail can be pinned to: the roster, the newest
 * tasks, the household's categories or its tags. It takes the panel over rather
 * than hanging off the row that opened it, because a flyout beside a row has
 * nowhere to go on a phone.
 *
 * One component for all four, so a row in any of them measures the same. The
 * two features that are not shared are told by their props: the block of people
 * who have left, and the box that searches a list too long to offer whole.
 */

"use client";

import { ChevronLeft, Loader2, Search } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { FormerDivider } from "@/components/app/group/overview/activity/former-divider";
import {
  allLabel,
  choiceHref,
} from "@/components/app/group/overview/activity/type-menu/type-menu.helpers";
import { FilterMenuRow } from "@/components/common/filter-menu/filter-menu-row";
import { opensFormerBlock } from "@/components/common/filter-menu/filter-menu-row.helpers";
import { DIVIDER, ROW, ROW_OFF } from "@/components/common/filter-menu/filter-menu.styles";
import type { AuditFilter, AuditFilterType } from "@/lib/audit/filter/filter.types";
import { QUERY_MAX_LENGTH } from "@/lib/validation/rules/rules";

// One row, which is a membership, a task or a label. Only a person can have
// left, so the flag the divider reads is optional.
export type ListRow = {
  ref: string;
  name: string;
  former?: boolean;
};

type EntityListProps = {
  path: string;
  // Carried into every link, so picking one keeps whatever else the URL asks
  // for. Its `ref` is the thing that is pinned, if any.
  filter: AuditFilter;
  // The kind this is a list of, which every link narrows the trail by.
  kind: AuditFilterType;
  // What the way back is called, which is the kind in the plural.
  title: string;
  rows: readonly ListRow[];
  // What a typed query matches, for a kind the panel can only offer a few of,
  // null where the search could not be made. Absent for a kind the panel offers
  // whole, which draws no box.
  onSearch?: (query: string) => Promise<ListRow[] | null>;
  onBack: () => void;
  onClose: () => void;
  back: RefObject<HTMLButtonElement | null>;
};

// Long enough that a reader is not searching after two letters, short enough
// that the list keeps up with typing. The board's own search waits the same.
const TYPING_PAUSE = 300;

const BOX =
  "text-label-md bg-muted text-foreground placeholder:text-muted-foreground mx-space-md my-space-xs px-space-sm min-h-11 rounded-lg outline-none";

const NO_MATCHES = "text-label-sm text-muted-foreground px-space-md py-space-sm";

/** Says why the list is empty, a search that could not be made being its own answer. */
function quiet(
  query: string,
  answered: { rows: readonly ListRow[] | null } | null,
  title: string,
): string {
  if (answered?.rows === null) return "We could not search just now. Try again.";
  if (query) return "Nothing matches that.";

  return `No ${title.toLowerCase()} yet.`;
}

/** Renders one row per thing, behind the way back to the kinds. */
export function EntityList({
  path,
  filter,
  kind,
  title,
  rows,
  onSearch,
  onBack,
  onClose,
  back,
}: Readonly<EntityListProps>) {
  const pinned = filter.ref;
  const [typed, setTyped] = useState("");
  // The query the rows answer, so a stale answer is told from the one being
  // waited for without a second state to keep in step. Null rows are a search
  // that failed, which is not the same as one that matched nothing.
  const [found, setFound] = useState<{ query: string; rows: readonly ListRow[] | null } | null>(
    null,
  );
  // Counts the searches, so an answer that arrives after a later one has been
  // asked for is dropped rather than drawn over it.
  const asked = useRef(0);
  const query = typed.trim();

  useEffect(() => {
    if (!onSearch || !query) return;

    const mine = ++asked.current;
    const timer = setTimeout(() => {
      void onSearch(query).then((rows) => {
        if (asked.current === mine) setFound({ query, rows });
      });
    }, TYPING_PAUSE);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const answered = found?.query === query ? found : null;
  // The last matches stay while the next ones are being read, so the list does
  // not empty itself between keystrokes.
  const shown = query ? (found?.rows ?? []) : rows;
  const busy = Boolean(query) && !answered;

  return (
    <div>
      {/* Named for where it goes rather than where it is, since the chevron
          beside it is hidden and the kind alone reads as another choice. */}
      <button
        ref={back}
        type="button"
        onClick={onBack}
        aria-label="Back to activity kinds"
        className={`${ROW} ${ROW_OFF}`}
      >
        <ChevronLeft className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{title}</span>
      </button>

      <div aria-hidden className={DIVIDER} />

      {onSearch ? (
        <div className="flex flex-col">
          <label className="sr-only" htmlFor={`${kind}-search`}>
            Search {title.toLowerCase()}
          </label>
          <div className="relative flex flex-col">
            <input
              id={`${kind}-search`}
              type="search"
              value={typed}
              maxLength={QUERY_MAX_LENGTH}
              placeholder={`Search ${title.toLowerCase()}`}
              onChange={(event) => setTyped(event.target.value)}
              className={`${BOX} pr-10 pl-9`}
            />
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2"
              aria-hidden
            />
            {busy ? (
              <Loader2
                className="text-muted-foreground absolute top-1/2 right-6 size-4 -translate-y-1/2 motion-safe:animate-spin"
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Capped and scrollable: a household is small, but nothing stops a list
          being long enough to run off the bottom of the screen. */}
      <ul className="scrollbar-slim max-h-64 overflow-y-auto">
        <FilterMenuRow
          href={choiceHref(path, filter, kind)}
          here={!pinned}
          name={allLabel(kind)}
          onPick={onClose}
        />

        {shown.map((row, index) => (
          <Fragment key={row.ref}>
            {opensFormerBlock(shown, index) ? <FormerDivider /> : null}

            <FilterMenuRow
              href={choiceHref(path, filter, kind, row.ref)}
              here={row.ref === pinned}
              name={row.name}
              former={row.former}
              onPick={onClose}
            />
          </Fragment>
        ))}
      </ul>

      {/* Held back while a search is in flight, so a list that is merely being
          read does not report itself as empty on the way. */}
      {shown.length === 0 && !busy ? (
        <p className={NO_MATCHES}>{quiet(query, answered, title)}</p>
      ) : null}
    </div>
  );
}
