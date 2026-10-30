/**
 * Which side of the list to show. Both boxes start ticked, and the last ticked
 * one is disabled: a list showing neither side is an empty page nobody asked
 * for, so one side is the only restriction there is.
 *
 * The boxes are buttons wearing the checkbox role, because a native one keeps
 * the platform's own look, which no token here can reach.
 */

"use client";

import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useId } from "react";
import { ACTIVE_PILL, PANEL, PILL, ROW } from "@/components/app/group-filters/group-filters.styles";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import { SHOW_OPTIONS } from "@/lib/groups/filter/filter";
import type { GroupShow } from "@/lib/groups/filter/filter.types";

type ShowMenuProps = {
  show: readonly GroupShow[];
  onToggle: (value: GroupShow) => void;
};

const BOX = "flex size-4 shrink-0 items-center justify-center rounded border transition-colors";

const TICKED = "bg-primary border-primary text-primary-foreground";

const EMPTY = "border-border";

/** Renders the show pill and the boxes behind it. */
export function ShowMenu({ show, onToggle }: Readonly<ShowMenuProps>) {
  const { open, toggle, root, trigger } = useDisclosure();
  const panelId = useId();

  const only = show.length === 1 ? SHOW_OPTIONS.find((option) => option.value === show[0]) : null;

  return (
    <div ref={root} className="relative flex-1 sm:flex-none">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={only ? `Show, ${only.label} only` : "Show"}
        onClick={toggle}
        className={only ? ACTIVE_PILL : PILL}
      >
        <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
        Show
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </button>

      {open ? (
        <div id={panelId} className={`${PANEL} left-0`}>
          <ul>
            {SHOW_OPTIONS.map((option) => {
              const ticked = show.includes(option.value);

              return (
                <li key={option.value}>
                  {/* The panel stays open: ticking one side is rarely the whole
                      question, and a navigation does not close it. */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={ticked}
                    disabled={ticked && show.length === 1}
                    onClick={() => onToggle(option.value)}
                    className={`${ROW} disabled:opacity-60`}
                  >
                    <span className={`${BOX} ${ticked ? TICKED : EMPTY}`}>
                      {ticked ? <Check className="size-3" aria-hidden /> : null}
                    </span>
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>

          {only ? (
            <p className="text-label-sm text-muted-foreground px-space-md pt-space-xs">
              One side has to stay on.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
