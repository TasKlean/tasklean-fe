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
import { EntityList } from "@/components/app/group/overview/activity/type-menu/entity-list/entity-list";
import type { ListRow } from "@/components/app/group/overview/activity/type-menu/entity-list/entity-list";
import { KindList } from "@/components/app/group/overview/activity/type-menu/kind-list";
import {
  chosenChoice,
  pluralLabel,
} from "@/components/app/group/overview/activity/type-menu/type-menu.helpers";
import {
  PANEL,
  TRIGGER,
  TRIGGER_ARROW,
  TRIGGER_ON,
  TRIGGER_QUIET,
} from "@/components/common/filter-menu/filter-menu.styles";
import { Tooltip } from "@/components/common/tooltip/tooltip";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import type { EntityChoice, MemberChoice } from "@/lib/audit/audit.types";
import { pinnedLabel } from "@/lib/audit/filter/filter";
import type { AuditFilter, AuditFilterType } from "@/lib/audit/filter/filter.types";

type TypeMenuProps = {
  // The path the links hang off, without a query of its own.
  path: string;
  filter: AuditFilter;
  // The roster, which names the people a feed can be pinned to. Empty where it
  // would not load, which costs that list and nothing else.
  members: readonly MemberChoice[];
  // The newest few tasks, the rest reachable through the search beside them.
  tasks: readonly EntityChoice[];
  categories: readonly EntityChoice[];
  tags: readonly EntityChoice[];
  // What a typed search matches, which only the task list offers.
  onSearchTasks: (query: string) => Promise<EntityChoice[]>;
  // What the one thing the feed is pinned to is called, where the screen could
  // resolve it. Null for a kind no screen resolves, and for a name that is gone.
  pinned: string | null;
};

type View = "kinds" | AuditFilterType;

// What the pill reads while the feed is the whole trail. The panel's own row
// still says "All activity", being a choice rather than a heading.
const NAME = "Entity type";

/** Names what the pill says the feed is narrowed to. */
function triggerLabel(filter: AuditFilter, kind: string, pinned: string | null): string {
  if (!filter.type) return NAME;
  if (!filter.ref) return kind;

  return pinnedLabel(filter.type, pinned);
}

/** Renders the kind the trail is narrowed to, with the rest a press away. */
export function TypeMenu({
  path,
  filter,
  members,
  tasks,
  categories,
  tags,
  onSearchTasks,
  pinned,
}: Readonly<TypeMenuProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();
  // Opens on the list the feed is already pinned inside, so moving from one
  // task to another is a press rather than three.
  const home: View = filter.type && filter.ref ? filter.type : "kinds";
  const [view, setView] = useState<View>(home);
  const drill = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  // Which row the way back lands on, which is the one that was pressed.
  const [from, setFrom] = useState<AuditFilterType | null>(home === "kinds" ? null : home);
  // Set by a press, so the move below cannot fire when the panel merely opens
  // and take focus off the trigger.
  const stepped = useRef(false);

  const chosen = chosenChoice(filter.type);
  const label = triggerLabel(filter, chosen.label, pinned);
  const rows: Partial<Record<AuditFilterType, readonly ListRow[]>> = {
    member: members,
    task: tasks,
    category: categories,
    tag: tags,
  };
  // A kind with nothing to offer keeps its own row and loses only the press
  // beside it, which would open an empty panel.
  const pickable = (Object.keys(rows) as AuditFilterType[]).filter(
    (kind) => (rows[kind] ?? []).length > 0,
  );
  const listed = view === "kinds" ? null : rows[view];

  useEffect(() => {
    if (!stepped.current) return;

    stepped.current = false;
    // The panel the press asked for has replaced the button that asked, so
    // focus follows it rather than falling to the document.
    (view === "kinds" ? drill : back).current?.focus();
  }, [view]);

  /** Swaps the panel for the other one, and sends focus after it. */
  function step(next: View) {
    stepped.current = true;
    if (next !== "kinds") setFrom(next);
    setView(next);
  }

  /** Opens the panel where the filter already is, or closes it. */
  function flip() {
    // Reset on the way open rather than from an effect watching `open`: Escape
    // and a press outside both close without passing through here.
    if (!open) {
      setView(home);
      setFrom(home === "kinds" ? null : home);
    }
    toggle();
  }

  return (
    <div ref={root} className="relative min-w-0 flex-1 sm:w-fit sm:flex-none">
      <Tooltip text="What has happened to this entity" width="fill" place="above-start">
        <button
          ref={trigger}
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={`Filter activity, showing ${filter.ref ? label : chosen.label}`}
          onClick={flip}
          className={`${TRIGGER} ${filter.type ? TRIGGER_ON : TRIGGER_QUIET}`}
        >
          <ListFilter className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
          <ChevronDown className={TRIGGER_ARROW} aria-hidden />
        </button>
      </Tooltip>

      {open ? (
        <div id={panelId} className={`${PANEL} left-0 w-64`}>
          {view !== "kinds" && listed ? (
            <EntityList
              path={path}
              filter={filter}
              kind={view}
              title={pluralLabel(view)}
              rows={listed}
              onSearch={view === "task" ? onSearchTasks : undefined}
              onBack={() => step("kinds")}
              onClose={close}
              back={back}
            />
          ) : (
            <KindList
              path={path}
              filter={filter}
              pickable={pickable}
              onPick={step}
              onClose={close}
              drillFor={from}
              drill={drill}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
