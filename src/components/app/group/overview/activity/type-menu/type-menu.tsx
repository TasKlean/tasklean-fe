/**
 * The kind of thing a trail is narrowed to, and the member it is pinned to. One
 * dropdown rather than a row of chips, because the kinds are a closed list a
 * reader picks one of, and a row of seven wrapped onto three lines on a phone.
 *
 * A disclosure of links, not a listbox: the filter is the URL, so every choice
 * is somewhere to go and the server decides which one is current.
 */

"use client";

import { ChevronDown, ListFilter } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { KindList } from "@/components/app/group/overview/activity/type-menu/kind-list";
import { MemberList } from "@/components/app/group/overview/activity/type-menu/member-list";
import { chosenChoice } from "@/components/app/group/overview/activity/type-menu/type-menu.helpers";
import {
  PANEL,
  TRIGGER,
  TRIGGER_ARROW,
  TRIGGER_ON,
  TRIGGER_QUIET,
} from "@/components/app/group/overview/activity/filter-menu.styles";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import type { MemberChoice } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

type TypeMenuProps = {
  // The path the links hang off, without a query of its own.
  path: string;
  filter: AuditFilter;
  // The roster, which is the one kind a screen can list. Empty where it would
  // not load, which costs the member list and nothing else.
  members: readonly MemberChoice[];
};

type View = "kinds" | "member";

// What the pill reads while the feed is the whole trail. The panel's own row
// still says "All activity", being a choice rather than a heading.
const NAME = "Entity type";

/** Renders the kind the trail is narrowed to, with the rest a press away. */
export function TypeMenu({ path, filter, members }: Readonly<TypeMenuProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();
  // Opens on the member list when the feed is already pinned to one, so moving
  // from one member to another is a press rather than three.
  const home: View = filter.type === "member" && filter.ref ? "member" : "kinds";
  const [view, setView] = useState<View>(home);
  const drill = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  // Set by a press, so the move below cannot fire when the panel merely opens
  // and take focus off the trigger.
  const stepped = useRef(false);

  const chosen = chosenChoice(filter.type);
  const pickable = members.length > 0;

  useEffect(() => {
    if (!stepped.current) return;

    stepped.current = false;
    // The panel the press asked for has replaced the button that asked, so
    // focus follows it rather than falling to the document.
    (view === "member" ? back : drill).current?.focus();
  }, [view]);

  /** Swaps the panel for the other one, and sends focus after it. */
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
    <div ref={root} className="relative min-w-0 flex-1 sm:w-fit sm:flex-none">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Filter activity, showing ${chosen.label}`}
        onClick={flip}
        className={`${TRIGGER} ${filter.type ? TRIGGER_ON : TRIGGER_QUIET}`}
      >
        <ListFilter className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{filter.type ? chosen.label : NAME}</span>
        <ChevronDown className={TRIGGER_ARROW} aria-hidden />
      </button>

      {open ? (
        <div id={panelId} className={`${PANEL} left-0 w-64`}>
          {view === "member" && pickable ? (
            <MemberList
              path={path}
              filter={filter}
              members={members}
              onBack={() => step("kinds")}
              onClose={close}
              back={back}
            />
          ) : (
            <KindList
              path={path}
              filter={filter}
              pickable={pickable}
              onPick={() => step("member")}
              onClose={close}
              drill={drill}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
