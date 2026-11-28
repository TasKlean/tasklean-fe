/**
 * The kinds a trail can be narrowed to. Links rather than options, so the
 * filter stays the URL; a kind a screen can list carries a second press beside
 * its label, which swaps this panel for that list.
 */

import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { RefObject } from "react";
import {
  CHOICES,
  choiceHref,
  drillLabel,
} from "@/components/app/group/overview/activity/type-menu/type-menu.helpers";
import { DRILL, ROW, ROW_OFF, ROW_ON } from "@/components/common/filter-menu/filter-menu.styles";
import type { AuditFilter, AuditFilterType } from "@/lib/audit/filter/filter.types";

type KindListProps = {
  path: string;
  filter: AuditFilter;
  // The kinds that offer a list of their own, which is every kind a screen
  // could read and that holds anything at all.
  pickable: readonly AuditFilterType[];
  onPick: (kind: AuditFilterType) => void;
  onClose: () => void;
  // Which row's press takes focus, which is the one the panel came back from.
  drillFor: AuditFilterType | null;
  drill: RefObject<HTMLButtonElement | null>;
};

/** Renders every kind, with the one that is on marked. */
export function KindList({
  path,
  filter,
  pickable,
  onPick,
  onClose,
  drillFor,
  drill,
}: Readonly<KindListProps>) {
  return (
    <ul>
      {CHOICES.map((choice) => {
        const here = choice.value === filter.type;
        const kind = choice.value;
        const steps = kind !== null && pickable.includes(kind);

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
                ref={kind === drillFor ? drill : undefined}
                type="button"
                onClick={() => onPick(kind)}
                aria-label={drillLabel(kind)}
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
