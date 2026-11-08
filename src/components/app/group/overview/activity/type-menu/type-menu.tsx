/**
 * The kind of thing the trail is narrowed to. One dropdown rather than a row of
 * chips, because the kinds are a closed list a reader picks one of, and a row
 * of seven wrapped onto three lines on a phone.
 *
 * A disclosure of links, not a listbox: the filter is the URL, so each choice
 * is somewhere to go and the server decides which one is current.
 */

"use client";

import { Check, ChevronDown, ListFilter } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import { FILTER_OPTIONS } from "@/lib/audit/filter/filter";
import type { AuditFilter, AuditFilterType } from "@/lib/audit/filter/filter.types";

type TypeMenuProps = {
  // The path the links hang off, without a query of its own.
  path: string;
  filter: AuditFilter;
};

type Choice = { value: AuditFilterType | null; label: string };

const ALL: Choice = { value: null, label: "All activity" };
const CHOICES: readonly Choice[] = [ALL, ...FILTER_OPTIONS];

const TRIGGER =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors";
const QUIET = "border-border/60 bg-card text-foreground hover:bg-muted";
// What the trigger wears while it is holding something back, which is how the
// row says a filter is on without a count nobody reads at a glance.
const CURRENT = "bg-secondary text-secondary-foreground border-transparent";
const PANEL =
  "bg-card border-border/60 shadow-level-3 py-space-xs absolute top-full left-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border";
const ROW =
  "text-label-md gap-space-sm px-space-md flex min-h-11 w-full items-center transition-colors";

/** Renders the kind the trail is narrowed to, with the rest a press away. */
export function TypeMenu({ path, filter }: Readonly<TypeMenuProps>) {
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();

  const chosen = CHOICES.find((choice) => choice.value === filter.type) ?? ALL;

  return (
    <div ref={root} className="relative w-fit">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Filter activity, showing ${chosen.label}`}
        onClick={toggle}
        className={`${TRIGGER} ${filter.type ? CURRENT : QUIET}`}
      >
        <ListFilter className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{chosen.label}</span>
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </button>

      {open ? (
        <ul id={panelId} className={PANEL}>
          {CHOICES.map((choice) => {
            const here = choice.value === filter.type;

            return (
              <li key={choice.value ?? "all"}>
                <Link
                  // A kind drops any ref alongside it: a ref names one entity,
                  // which is a narrower thing than the kind being asked for.
                  href={choice.value ? `${path}?type=${choice.value}` : path}
                  aria-current={here ? "page" : undefined}
                  onClick={close}
                  className={`${ROW} ${
                    here
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {/* Held rather than dropped, so every label starts at the
                      same place whichever kind is on. */}
                  <Check className={`size-4 shrink-0 ${here ? "" : "invisible"}`} aria-hidden />
                  <span className="truncate">{choice.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
