/**
 * One row in a filter menu's panel: a link that narrows the trail, ticked when
 * the feed is already reading it. Shared by both menus, so the wording that
 * says somebody has left the group lives in one place.
 */

import { Check } from "lucide-react";
import Link from "next/link";
import { ROW, ROW_OFF, ROW_ON } from "@/components/common/activity/filter-menu.styles";

type FilterMenuRowProps = {
  href: string;
  // Whether the feed is already narrowed to this choice.
  here: boolean;
  name: string;
  // Whether this is a member who has left. The divider above the block is the
  // visible mark, so here it only reaches assistive tech. Absent for a choice
  // that is not a person, such as "Anyone".
  former?: boolean;
  onPick: () => void;
};

/** Renders one choice, naming a person who is no longer a member as such. */
export function FilterMenuRow({
  href,
  here,
  name,
  former = false,
  onPick,
}: Readonly<FilterMenuRowProps>) {
  return (
    <li>
      <Link
        href={href}
        aria-current={here ? "page" : undefined}
        // The divider that marks the block is hidden, so the row is where a
        // reader who cannot see it is told.
        aria-label={former ? `${name}, no longer in the group` : undefined}
        onClick={onPick}
        className={`${ROW} ${here ? ROW_ON : ROW_OFF}`}
      >
        <Check className={`size-4 shrink-0 ${here ? "" : "invisible"}`} aria-hidden />
        <span className="truncate">{name}</span>
      </Link>
    </li>
  );
}
