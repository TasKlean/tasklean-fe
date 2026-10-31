/** The shape of a group's navigation: entries, and the sections they sit in. */

import type { LucideIcon } from "lucide-react";

export type GroupNavItem = {
  label: string;
  icon: LucideIcon;
  // Absent where the entry is an action rather than a screen, which is leaving
  // a group: there is no route to point at, now or later.
  href?: string;
  // The screen does not exist yet, so the nav renders a dead entry saying so
  // rather than a link into a 404.
  soon?: boolean;
  // Marks an entry that ends something, so the nav can say so quietly.
  destructive?: boolean;
  // The way out of an area, which is divided off from its sections: mixed in
  // with them it reads as one of them.
  back?: boolean;
};

export type GroupNavSection = {
  label: string;
  items: GroupNavItem[];
  // Where the band goes below `lg`: the strip that scrolls above the section,
  // or the bottom bar's menu. Both are bands of the rail at `lg`.
  phone: "strip" | "menu";
};
