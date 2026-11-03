/**
 * The trail in the header, at `lg` and up: the list, the group, the area and
 * the section, each a pill of its own. Below `lg` there is no room for four of
 * them, so the header shows the group pill alone instead and this renders
 * nothing.
 */

"use client";

import { usePathname } from "next/navigation";
import { CrumbPill } from "@/components/app/chrome/group-breadcrumb/crumb-pill";
import { buildCrumbs } from "@/components/app/chrome/group-breadcrumb/group-breadcrumb.helpers";
import type { MyGroup } from "@/lib/groups/groups.types";

type GroupBreadcrumbProps = {
  groups: MyGroup[];
};

/** Renders the header's trail for the open path. */
export function GroupBreadcrumb({ groups }: Readonly<GroupBreadcrumbProps>) {
  const crumbs = buildCrumbs(usePathname(), groups);

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 lg:block">
      {/* A list, so the trail is announced as four items rather than one run of
          text, and the separators are decoration between them. */}
      <ol className="gap-space-xs flex min-w-0 items-center">
        {crumbs.map((crumb, index) => (
          <li key={crumb.level} className="gap-space-xs flex min-w-0 items-center">
            {index === 0 ? null : (
              // Decoration: the list is what says these are four levels, so a
              // reader is never told "slash" between them.
              <span aria-hidden className="text-muted-foreground/60 shrink-0 select-none">
                /
              </span>
            )}
            <CrumbPill crumb={crumb} here={index === crumbs.length - 1} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
