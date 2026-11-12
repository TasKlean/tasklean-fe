/**
 * The ranges on offer, and the way through to one of the reader's own. Every
 * preset is a link, so the server decides which is current; Custom is a press,
 * because it has no days of its own until they are typed.
 */

import { Check, ChevronRight } from "lucide-react";
import type { RefObject } from "react";
import { FilterMenuRow } from "@/components/app/group/overview/activity/filter-menu-row";
import {
  DIVIDER,
  ROW,
  ROW_OFF,
  ROW_ON,
} from "@/components/app/group/overview/activity/filter-menu.styles";
import type { DateChoice } from "@/lib/audit/dates/dates";

type PresetListProps = {
  // One href per preset, already carrying the rest of the filter.
  choices: readonly { choice: DateChoice; href: string; here: boolean }[];
  // Whether the feed is on a range that is nobody's preset.
  custom: boolean;
  onCustom: () => void;
  onClose: () => void;
  drill: RefObject<HTMLButtonElement | null>;
};

/** Renders a row per preset, with the custom range a press away. */
export function PresetList({
  choices,
  custom,
  onCustom,
  onClose,
  drill,
}: Readonly<PresetListProps>) {
  return (
    <div>
      <ul>
        {choices.map((row) => (
          <FilterMenuRow
            key={row.choice.label}
            href={row.href}
            here={row.here}
            name={row.choice.label}
            onPick={onClose}
          />
        ))}
      </ul>

      <div aria-hidden className={DIVIDER} />

      {/* A press rather than a link: it opens the fields instead of asking for
          a feed, so there is nothing to navigate to yet. */}
      <button
        ref={drill}
        type="button"
        onClick={onCustom}
        aria-label="Choose a custom range"
        className={`${ROW} ${custom ? ROW_ON : ROW_OFF}`}
      >
        <Check className={`size-4 shrink-0 ${custom ? "" : "invisible"}`} aria-hidden />
        <span className="truncate">Custom range</span>
        <ChevronRight className="ml-auto size-4 shrink-0" aria-hidden />
      </button>
    </div>
  );
}
