/**
 * The board's one filter control: a press that drops a panel holding every
 * axis at once, applied in a single press rather than one navigation per
 * choice. The panel is a GET form posting to the board's own path, so it
 * narrows the board with no JavaScript; the disclosure is the only part that
 * needs any.
 *
 * The page is deliberately not posted, so a new filter starts at page one.
 *
 * With JavaScript the submit is taken over, because a native GET posts every
 * field it holds and an untouched one posts empty: `?category=&tag=` narrows
 * nothing and says it does. The form data goes back through `taskQuery` and out
 * through `boardHref`, the one place the board's URL is written, so a press
 * here and a link elsewhere cannot disagree.
 */

"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId } from "react";
import { FilterFields } from "@/components/app/group/board/filter-panel/filter-fields";
import {
  TRIGGER,
  TRIGGER_ARROW,
  TRIGGER_ON,
  TRIGGER_QUIET,
} from "@/components/common/filter-menu/filter-menu.styles";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import { activeFilterCount, boardHref, taskQuery } from "@/lib/tasks/filter/filter";
import type {
  LabelChoice,
  TaskQuery,
  TaskSearchParams,
  WhoChoice,
} from "@/lib/tasks/filter/filter.types";

type FilterPanelProps = {
  path: string;
  query: TaskQuery;
  members: readonly WhoChoice[];
  categories: readonly LabelChoice[];
  tags: readonly LabelChoice[];
};

// A sheet above the phone's bottom bar, a dropdown off the trigger from `lg`:
// hanging off the trigger put the footer under that fixed bar on a short phone.
const PANEL =
  "bg-card border-border/60 shadow-level-3 p-space-md right-margin bottom-[calc(var(--spacing-shelf)+var(--spacing-space-sm))] fixed left-auto z-30 flex max-h-[calc(100svh-var(--spacing-header)-var(--spacing-shelf)-var(--spacing-space-lg))] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-xl border lg:absolute lg:top-full lg:right-0 lg:bottom-auto lg:mt-2 lg:max-h-[70svh]";

// Only the fields scroll, so Apply never falls below the fold. `min-h-0` lets a
// flex child shrink past its content, and auto on one axis makes both auto.
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
  const router = useRouter();
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();
  const count = activeFilterCount(query);

  /** Applies the panel as a URL holding only the axes something was picked on. */
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const asked: TaskSearchParams = {};
    for (const [name, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value !== "string") continue;

      const held = asked[name];
      // A name repeats for a checkbox group, where the last box would win.
      if (held === undefined) asked[name] = value;
      else asked[name] = Array.isArray(held) ? [...held, value] : [held, value];
    }

    close();
    // Read as if it had arrived in the URL and written back out, so an empty
    // field and a default both come out as nothing rather than as a parameter.
    router.push(boardHref(path, taskQuery(asked), {}));
  }

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
        <form id={panelId} action={path} method="get" onSubmit={onSubmit} className={PANEL}>
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
