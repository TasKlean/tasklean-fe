/**
 * How far back the trail reaches. The presets are links like every other
 * filter, and a range of the reader's own sits behind the Custom row, which
 * takes the panel over the way the member list does.
 */

"use client";

import { CalendarRange, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { CustomRange } from "@/components/common/activity/date-menu/custom-range";
import { PresetList } from "@/components/common/activity/date-menu/preset-list";
import {
  PANEL,
  TRIGGER,
  TRIGGER_ARROW,
  TRIGGER_ON,
  TRIGGER_QUIET,
} from "@/components/common/activity/filter-menu.styles";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import { type DateChoice, rangeLabel } from "@/lib/audit/dates/dates";
import { auditFilterParams } from "@/lib/audit/filter/filter";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

type DateMenuProps = {
  // The path the links and the form hang off, without a query of its own.
  path: string;
  filter: AuditFilter;
  // The ranges on offer, worked out on the server from one instant and the
  // reader's zone.
  choices: readonly DateChoice[];
};

type View = "presets" | "custom";

const NAME = "Date";

/** Builds the link that sets one range, keeping the rest of the filter. */
function rangeHref(path: string, filter: AuditFilter, from: string, to: string): string {
  const query = auditFilterParams({ ...filter, from, to }).toString();

  return query ? `${path}?${query}` : path;
}

/** Renders the range the feed covers, with the presets and a custom one behind it. */
export function DateMenu({ path, filter, choices }: Readonly<DateMenuProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();
  const narrowed = Boolean(filter.from || filter.to);
  const label = rangeLabel(filter.from, filter.to, choices);
  // A range nobody offered is the reader's own, which is also what decides
  // which half of the panel opens.
  const custom = !choices.some((one) => one.from === filter.from && one.to === filter.to);
  const home: View = custom ? "custom" : "presets";
  const [view, setView] = useState<View>(home);
  const drill = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  // Set by a press, so the move below cannot fire when the panel merely opens
  // and take focus off the trigger.
  const stepped = useRef(false);

  useEffect(() => {
    if (!stepped.current) return;

    stepped.current = false;
    // The half the press asked for has replaced the button that asked, so focus
    // follows it rather than falling to the document.
    (view === "custom" ? back : drill).current?.focus();
  }, [view]);

  /** Moves between the presets and the fields, remembering that a press did it. */
  function step(next: View) {
    stepped.current = true;
    setView(next);
  }

  /** Opens the panel where the filter already is, or closes it. */
  function flip() {
    // Reset on the way open rather than from an effect watching `open`: Escape
    // and a press outside both close without passing through here.
    if (!open) setView(home);
    toggle();
  }

  return (
    <div ref={root} className="relative w-full min-w-0 sm:w-fit sm:flex-none">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Filter activity by date, showing ${label}`}
        onClick={flip}
        className={`${TRIGGER} ${narrowed ? TRIGGER_ON : TRIGGER_QUIET}`}
      >
        <CalendarRange className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{narrowed ? label : NAME}</span>
        <ChevronDown className={TRIGGER_ARROW} aria-hidden />
      </button>

      {open ? (
        // Hangs off the left on a phone, where this pill has a row to itself,
        // and off the right once it sits at the end of one.
        <div id={panelId} className={`${PANEL} left-0 w-72 sm:right-0 sm:left-auto`}>
          {view === "custom" ? (
            <CustomRange path={path} filter={filter} onBack={() => step("presets")} back={back} />
          ) : (
            <PresetList
              choices={choices.map((choice) => ({
                choice,
                href: rangeHref(path, filter, choice.from, choice.to),
                here: choice.from === filter.from && choice.to === filter.to,
              }))}
              custom={custom}
              onCustom={() => step("custom")}
              onClose={close}
              drill={drill}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
