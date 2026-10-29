/**
 * The header's one row, as wide as the page under it. A group page puts a rail
 * at the window's left edge, so the brand lines up with it; every other page is
 * a centred column, and a header wider than its page reads as two layouts.
 *
 * A client component only because the width follows the path.
 */

"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { openGroupUid } from "@/components/app/group-switcher/open-group-uid";

const BAR =
  "px-margin md:px-margin-tablet lg:px-margin-desktop gap-gutter flex h-16 items-center justify-between md:h-20";

type HeaderBarProps = {
  children: ReactNode;
};

/** Renders the header's row at the width the page beneath it uses. */
export function HeaderBar({ children }: Readonly<HeaderBarProps>) {
  const inGroup = openGroupUid(usePathname()) !== null;

  return <div className={`${BAR} ${inGroup ? "" : "max-w-app mx-auto"}`}>{children}</div>;
}
