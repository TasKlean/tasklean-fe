/**
 * One entry in a group's navigation, wherever it is shown: the rail, the strip
 * above a section, or the menu in a phone's bottom bar. Only the shape differs,
 * so the three cannot disagree about what a section is called or whether it is
 * built yet.
 */

import Link from "next/link";
import type { GroupNavItem } from "@/components/app/group-nav/group-nav.types";
import { itemTone } from "@/components/app/group-nav/item-tone";

const CHIP = "text-label-sm border-border/60 ml-auto shrink-0 rounded-full border px-2 py-0.5";

type NavEntryProps = {
  item: GroupNavItem;
  open: boolean;
  // The layout classes for where this entry sits, which is all that differs.
  shape: string;
  // How the text beside the icon hides, where it does.
  away?: string;
  onChoose?: () => void;
};

/** Renders one of a group's sections as a link, or as the promise of one. */
export function NavEntry({ item, open, shape, away = "", onChoose }: Readonly<NavEntryProps>) {
  const Icon = item.icon;
  const dead = item.soon === true;
  const className = `${shape} ${itemTone(open, dead, item.destructive === true)}`;

  if (dead || !item.href) {
    return (
      // Named in full, because a collapsed rail hides the label and the chip
      // beside it would run into it in any case.
      <button
        type="button"
        disabled
        aria-label={`${item.label}, coming soon`}
        className={className}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className={away}>{item.label}</span>
        <span className={`${CHIP} ${away}`}>Soon</span>
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={open ? "page" : undefined}
      aria-label={item.label}
      onClick={onChoose}
      className={className}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className={away}>{item.label}</span>
    </Link>
  );
}
