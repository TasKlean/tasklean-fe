/**
 * A range of the reader's own, behind the Custom row. A GET form, so picking
 * one is a navigation like every other filter and the control still works with
 * no JavaScript. It takes the panel over rather than hanging off the row that
 * opened it, as the member list does.
 */

import { ChevronLeft } from "lucide-react";
import { type RefObject, useState } from "react";
import { DIVIDER, ROW, ROW_OFF } from "@/components/app/group/overview/activity/filter-menu.styles";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

type CustomRangeProps = {
  // Where the form posts, which is the screen it is already on.
  path: string;
  // Carried as hidden fields, so setting a range keeps the rest of the filter.
  filter: AuditFilter;
  onBack: () => void;
  back: RefObject<HTMLButtonElement | null>;
};

const FIELD =
  "text-body-md bg-muted text-foreground focus-visible:ring-ring px-space-sm min-h-11 w-full rounded-md focus-visible:ring-2 focus-visible:outline-none";

const FIELD_LABEL = "text-label-sm text-muted-foreground gap-space-xs flex flex-col";

const APPLY =
  "text-label-md px-space-md bg-primary text-primary-foreground hover:bg-primary/90 min-h-11 w-full rounded-full transition-colors";

/** Renders the two days and the press that applies them. */
export function CustomRange({ path, filter, onBack, back }: Readonly<CustomRangeProps>) {
  // Seeded from the URL and then its own: a reader who steps back to the
  // presets and returns finds what they had typed.
  const [from, setFrom] = useState(filter.from);
  const [to, setTo] = useState(filter.to);

  return (
    <div>
      {/* Named for where it goes rather than where it is, since the chevron
          beside it is hidden and "Dates" alone reads as another choice. */}
      <button
        ref={back}
        type="button"
        onClick={onBack}
        aria-label="Back to the date presets"
        className={`${ROW} ${ROW_OFF}`}
      >
        <ChevronLeft className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Custom range</span>
      </button>

      <div aria-hidden className={DIVIDER} />

      <form
        method="get"
        action={path}
        aria-label="Custom date range"
        className="gap-space-sm px-space-md py-space-xs flex flex-col"
      >
        {filter.type ? <input type="hidden" name="type" value={filter.type} /> : null}
        {filter.ref ? <input type="hidden" name="ref" value={filter.ref} /> : null}
        {filter.actor ? <input type="hidden" name="actor" value={filter.actor} /> : null}

        <label className={FIELD_LABEL}>
          From
          {/* Capped at the other end, so the pair the endpoint refuses with a
              400 cannot be submitted. */}
          <input
            type="date"
            name="from"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            className={FIELD}
          />
        </label>

        <label className={FIELD_LABEL}>
          To
          <input
            type="date"
            name="to"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            className={FIELD}
          />
        </label>

        <button type="submit" className={APPLY}>
          Apply range
        </button>
      </form>
    </div>
  );
}
