/** The shape of the header's trail: one crumb, and the list each one drops. */

import type { LucideIcon } from "lucide-react";

export type CrumbItem = {
  label: string;
  icon?: LucideIcon;
  // Absent where the screen does not exist yet, which the item then says
  // instead of linking into a 404.
  href?: string;
  // The item this crumb is currently on, which wears a check.
  current?: boolean;
};

export type CrumbLevel = "list" | "group" | "area" | "section";

export type Crumb = {
  // Which level of the trail this is, and so its key: two crumbs can share an
  // href, since a group's own page is both the group and its tasks.
  level: CrumbLevel;
  label: string;
  // Where the label half of the pill goes. Every crumb has one, including the
  // two that point at a path which redirects on arrival.
  href: string;
  // Names the arrow half, since the label beside it is a separate control and
  // "expand" alone would not say what is being expanded.
  opens: string;
  items: CrumbItem[];
};
