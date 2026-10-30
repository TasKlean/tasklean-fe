/**
 * A group's rail, down the left edge of the window: which group you are in, the
 * sections it holds, and a press that narrows it to icons. Below `lg` there is
 * no rail, so the card and a scrollable strip sit above the content instead and
 * there is nothing to collapse.
 *
 * At `lg` it stands still while the section beside it scrolls, by sticking at
 * the header's height and taking the rest of the viewport.
 */

"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GroupNav } from "@/components/app/group-nav/group-nav";
import { groupPath, openGroupArea } from "@/components/app/group-nav/open-group-area";
import { GroupSummary } from "@/components/app/group-sidebar/group-summary";

// `svh` rather than `dvh`: a growing viewport would leave the rail a few
// pixels taller than the window every time a phone's address bar hid, and the
// overflow is the safety valve for a rail taller than a short screen.
const RAIL =
  "gap-space-md px-margin md:px-margin-tablet pt-space-lg pb-space-md lg:px-space-md lg:pb-space-md border-border/60 lg:top-header lg:h-[calc(100svh-var(--spacing-header))] scrollbar-slim flex shrink-0 flex-col border-b lg:sticky lg:overflow-y-auto lg:border-r lg:border-b-0";

// What sits above the first entry at `lg`. In an area the card is gone, so the
// rail's own gap would be spacing above nothing: it goes with it, and the room
// the card used to need goes too.
const TOP = {
  tasks: "lg:pt-space-xl",
  area: "lg:gap-0 lg:pt-space-lg",
} as const;

type GroupSidebarProps = {
  uid: string;
  name: string;
  photoUrl: string | null;
  description: string | null;
  memberCount: number | null;
  admin: boolean;
};

/** Renders a group's rail around its sections. */
export function GroupSidebar({
  uid,
  name,
  photoUrl,
  description,
  memberCount,
  admin,
}: Readonly<GroupSidebarProps>) {
  const [collapsed, setCollapsed] = useState(false);
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;
  // An area brings a menu of its own, which is what the card's space pays for.
  const inArea = openGroupArea(groupPath(uid), usePathname()) !== "tasks";

  return (
    <div
      className={`${RAIL} ${inArea ? TOP.area : TOP.tasks} ${collapsed ? "lg:w-20" : "lg:w-72"}`}
    >
      <GroupSummary
        name={name}
        photoUrl={photoUrl}
        description={description}
        memberCount={memberCount}
        admin={admin}
        collapsed={collapsed}
        inArea={inArea}
      />

      {/* The nav and the press that narrows it are one block, so the gap
          between them is the small one and the rail's own gap stays above it. */}
      <div className="gap-space-xs flex min-h-0 flex-col lg:flex-1">
        <GroupNav uid={uid} collapsed={collapsed} admin={admin} />

        <div className="hidden justify-end lg:flex">
          <button
            type="button"
            onClick={() => setCollapsed((wasCollapsed) => !wasCollapsed)}
            aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-11 items-center justify-center rounded-xl transition-colors"
          >
            <Toggle className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
