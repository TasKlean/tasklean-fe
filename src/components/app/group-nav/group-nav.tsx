/**
 * A group's navigation: the rail's body at `lg`, and below that the strip that
 * scrolls above the section. The band a phone keeps in its bottom bar is
 * rendered here too and hidden, so the rail stays one list in one place.
 *
 * A client component only because marking the open section needs the path.
 */

"use client";

import { usePathname } from "next/navigation";
import { NavEntry } from "@/components/app/group-nav/nav-entry";
import { navSections } from "@/components/app/group-nav/nav-sections";

const ITEM =
  "text-label-lg gap-space-sm px-space-md flex min-h-11 shrink-0 items-center rounded-xl whitespace-nowrap transition-colors lg:w-full";

const BAND = "gap-space-xs shrink-0 items-center lg:flex-col lg:items-stretch";

type GroupNavProps = {
  uid: string;
  collapsed: boolean;
};

/** Renders a group's sections, marking the open one. */
export function GroupNav({ uid, collapsed }: Readonly<GroupNavProps>) {
  const pathname = usePathname();
  const away = collapsed ? "lg:hidden" : "";
  const shape = `${ITEM} ${collapsed ? "lg:justify-center lg:px-0" : ""}`;

  return (
    <nav
      aria-label="Group sections"
      className="gap-space-md flex overflow-x-auto pb-1 lg:flex-1 lg:flex-col lg:justify-between lg:overflow-x-visible lg:pb-0"
    >
      {navSections(uid).map((section) => (
        <div
          key={section.label}
          // A phone carries this band in its bottom bar instead, so the rail's
          // copy waits until there is a rail to put it in.
          className={`${BAND} ${section.phone === "menu" ? "hidden lg:flex" : "flex"}`}
        >
          <h2
            id={`group-section-${section.label}`}
            className={`text-label-sm text-muted-foreground px-space-md hidden uppercase ${collapsed ? "" : "lg:block"}`}
          >
            {section.label}
          </h2>

          <ul
            aria-labelledby={`group-section-${section.label}`}
            className="gap-space-xs flex lg:w-full lg:flex-col"
          >
            {section.items.map((item) => (
              <li key={item.label}>
                <NavEntry item={item} open={pathname === item.href} shape={shape} away={away} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
