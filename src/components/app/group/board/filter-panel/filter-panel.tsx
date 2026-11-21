/**
 * The board's one filter control: a press that drops a panel holding every
 * axis at once, applied in a single press rather than one navigation per
 * choice. The panel is a GET form posting to the board's own path, so it
 * narrows the board with no JavaScript; the disclosure is the only part that
 * needs any.
 *
 * The page is deliberately not posted, so a new filter starts at page one.
 */

"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { FilterFields } from "@/components/app/group/board/filter-panel/filter-fields";
import {
  TRIGGER,
  TRIGGER_ARROW,
  TRIGGER_ON,
  TRIGGER_QUIET,
} from "@/components/common/filter-menu/filter-menu.styles";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import { activeFilterCount } from "@/lib/tasks/filter/filter";
import type { TaskQuery } from "@/lib/tasks/filter/filter.types";

type LabelChoice = { id: number; name: string; color?: string };
type WhoChoice = { memberUid: string; name: string; former: boolean };

type FilterPanelProps = {
  path: string;
  query: TaskQuery;
  members: readonly WhoChoice[];
  categories: readonly LabelChoice[];
  tags: readonly LabelChoice[];
};

// Hangs off the right edge and is capped at the viewport: it holds every axis,
// so on a short screen it has to scroll rather than run off the bottom.
const PANEL =
  "bg-card border-border/60 shadow-level-3 p-space-md absolute top-full right-0 z-30 mt-2 flex max-h-[70svh] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-xl border";

// Only the fields scroll, so Apply is never below the fold on a short screen.
// `min-h-0` is what lets a flex child shrink past its content and scroll, and
// `overflow-x-hidden` is required: one axis set to auto makes the other auto
// too, which let this box swallow the horizontal scroll the strips want.
const FIELDS = "scrollbar-slim -mr-1 min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1";

const FOOTER =
  "gap-space-sm border-border/60 pt-space-md mt-space-md flex shrink-0 items-center justify-between border-t";

const COUNT =
  "text-label-sm bg-secondary-foreground/15 grid size-5 shrink-0 place-items-center rounded-full";

const APPLY =
  "text-label-md px-space-md bg-primary text-primary-foreground hover:bg-primary-strong flex min-h-11 items-center rounded-full transition-colors";

const CLEAR =
  "text-label-md gap-space-xs px-space-xs text-muted-foreground hover:bg-muted hover:text-foreground flex min-h-11 items-center rounded-full transition-colors";

/** Renders the filter press and the panel it opens. */
export function FilterPanel({
  path,
  query,
  members,
  categories,
  tags,
}: Readonly<FilterPanelProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();
  const count = activeFilterCount(query);

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={count === 0 ? "Filter and sort" : `Filter and sort, ${count} applied`}
        onClick={toggle}
        className={`${TRIGGER} justify-center ${count > 0 ? TRIGGER_ON : TRIGGER_QUIET}`}
      >
        <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Filter &amp; sort</span>
        {count > 0 ? (
          <span className={COUNT} aria-hidden>
            {count}
          </span>
        ) : null}
        <ChevronDown className={TRIGGER_ARROW} aria-hidden />
      </button>

      {open ? (
        <form id={panelId} action={path} method="get" className={PANEL}>
          {/* The search has its own box on the bar, so it rides along rather
              than being cleared by a press that says nothing about it. */}
          {query.q ? <input type="hidden" name="q" value={query.q} /> : null}

          <div className={FIELDS}>
            <FilterFields query={query} members={members} categories={categories} tags={tags} />
          </div>

          <div className={FOOTER}>
            {count > 0 ? (
              <Link
                href={query.q ? `${path}?q=${encodeURIComponent(query.q)}` : path}
                className={CLEAR}
                onClick={close}
              >
                <X className="size-4 shrink-0" aria-hidden />
                Clear filters
              </Link>
            ) : (
              <span />
            )}

            <button type="submit" className={APPLY}>
              Apply
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
