/**
 * The kinds a trail can be narrowed to. Links rather than options, so the
 * filter stays the URL; the one kind a screen can list carries a second press
 * beside its label, which swaps this panel for that list.
 */

import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { RefObject } from "react";
import {
  CHOICES,
  choiceHref,
} from "@/components/app/group/overview/activity/type-menu/type-menu.helpers";
import { DRILL, ROW, ROW_OFF, ROW_ON } from "@/components/common/activity/filter-menu.styles";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

type KindListProps = {
  path: string;
  filter: AuditFilter;
  // Whether the member row offers a list of its own, which it does not when the
  // roster would not load.
  pickable: boolean;
  onPick: () => void;
  onClose: () => void;
  drill: RefObject<HTMLButtonElement | null>;
};

/** Renders every kind, with the one that is on marked. */
export function KindList({
  path,
  filter,
  pickable,
  onPick,
  onClose,
  drill,
}: Readonly<KindListProps>) {
  return (
    <ul>
      {CHOICES.map((choice) => {
        const here = choice.value === filter.type;
        const steps = pickable && choice.value === "member";

        return (
          <li key={choice.value ?? "all"} className="flex items-stretch">
            <Link
              href={choiceHref(path, filter, choice.value)}
              aria-current={here ? "page" : undefined}
              onClick={onClose}
              className={`${ROW} ${here ? ROW_ON : ROW_OFF} min-w-0 flex-1`}
            >
              {/* Held rather than dropped, so every label starts at the same
                  place whichever kind is on. */}
              <Check className={`size-4 shrink-0 ${here ? "" : "invisible"}`} aria-hidden />
              <span className="truncate">{choice.label}</span>
            </Link>

            {steps ? (
              <button
                ref={drill}
                type="button"
                onClick={onPick}
                aria-label="Choose one member"
                className={DRILL}
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
