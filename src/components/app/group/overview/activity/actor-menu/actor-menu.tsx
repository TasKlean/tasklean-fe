/**
 * Whose actions the trail is narrowed to. A separate control from the kind
 * menu, because an actor is a different question from what the rows are about
 * and the endpoint takes both at once.
 *
 * An admin's control only: a plain member may name nobody but themselves, and
 * the refusal is a 403 carrying no code, which a group screen reads as the
 * group being gone. The page decides whether to render this at all.
 */

"use client";

import { ChevronDown, UserSearch } from "lucide-react";
import { Fragment, useId } from "react";
import { FilterMenuRow } from "@/components/app/group/overview/activity/filter-menu-row";
import { opensFormerBlock } from "@/components/app/group/overview/activity/filter-menu-row.helpers";
import {
  PANEL,
  TRIGGER,
  TRIGGER_ARROW,
  TRIGGER_ON,
  TRIGGER_QUIET,
} from "@/components/app/group/overview/activity/filter-menu.styles";
import { FormerDivider } from "@/components/app/group/overview/activity/former-divider";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import type { ActorChoice } from "@/lib/audit/audit.types";
import { auditFilterParams } from "@/lib/audit/filter/filter";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

type ActorMenuProps = {
  // The path the links hang off, without a query of its own.
  path: string;
  filter: AuditFilter;
  // Everyone the feed can be narrowed to, in the roster's order. Their refs are
  // user uids, which is what an entry's own actor is named by.
  actors: readonly ActorChoice[];
};

const ANYONE = "Anyone";

/** Builds the link that narrows the trail to one person's actions, or to nobody's. */
function actorHref(path: string, filter: AuditFilter, actor: string): string {
  const query = auditFilterParams({ ...filter, actor }).toString();

  return query ? `${path}?${query}` : path;
}

/** Renders whose actions the trail shows, with everybody else a press away. */
export function ActorMenu({ path, filter, actors }: Readonly<ActorMenuProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();

  const chosen = actors.find((actor) => actor.ref === filter.actor);
  const label = chosen?.name ?? ANYONE;

  return (
    <div ref={root} className="relative min-w-0 flex-1 sm:w-fit sm:flex-none">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Filter activity by who acted, showing ${label}`}
        onClick={toggle}
        className={`${TRIGGER} ${filter.actor ? TRIGGER_ON : TRIGGER_QUIET}`}
      >
        <UserSearch className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
        <ChevronDown className={TRIGGER_ARROW} aria-hidden />
      </button>

      {open ? (
        // Capped and scrollable, as the member list is: a household is small,
        // but nothing stops a roster running off the bottom of the screen.
        <ul id={panelId} className={`${PANEL} scrollbar-slim right-0 max-h-72 overflow-y-auto`}>
          <FilterMenuRow
            href={actorHref(path, filter, "")}
            here={!filter.actor}
            name={ANYONE}
            onPick={close}
          />

          {actors.map((actor, index) => (
            <Fragment key={actor.ref}>
              {opensFormerBlock(actors, index) ? <FormerDivider /> : null}

              <FilterMenuRow
                href={actorHref(path, filter, actor.ref)}
                here={actor.ref === filter.actor}
                name={actor.name}
                former={actor.former}
                onPick={close}
              />
            </Fragment>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
