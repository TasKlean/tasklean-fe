/**
 * The order the list is in. One choice at a time, so a press sets it and the
 * panel closes, and the pill carries the chosen order rather than the word
 * "Sort": the order is the useful half.
 *
 * The pill wears the short form of it. Half of a 360px row holds 160px, and
 * "Recently joined" between two icons needs 177.
 */

"use client";

import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { useId } from "react";
import { PANEL, PILL, ROW } from "@/components/app/groups/group-filters/group-filters.styles";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import { SORT_OPTIONS } from "@/lib/groups/filter/filter";
import type { GroupSort } from "@/lib/groups/filter/filter.types";

type SortMenuProps = {
  sort: GroupSort;
  onChoose: (value: GroupSort) => void;
};

/** Renders the sort pill and the orders behind it. */
export function SortMenu({ sort, onChoose }: Readonly<SortMenuProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();

  const chosen = SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0];

  return (
    <div ref={root} className="relative flex-1 sm:flex-none">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Sort by ${chosen.label}`}
        onClick={toggle}
        className={PILL}
      >
        <ArrowUpDown className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{chosen.short}</span>
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </button>

      {open ? (
        <ul id={panelId} className={`${PANEL} right-0`}>
          {SORT_OPTIONS.map((option) => {
            const here = option.value === sort;

            return (
              <li key={option.value}>
                <button
                  type="button"
                  aria-pressed={here}
                  onClick={() => {
                    onChoose(option.value);
                    close();
                  }}
                  className={ROW}
                >
                  {/* Held rather than dropped, so every label starts at the
                      same place whichever order is on. */}
                  <Check className={`size-4 shrink-0 ${here ? "" : "invisible"}`} aria-hidden />
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
