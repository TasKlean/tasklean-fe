/**
 * A group's rail, down the left edge of the window: which group you are in, the
 * sections it holds, and a press that narrows it to icons. Below `lg` there is
 * no rail, so the card and a scrollable strip sit above the content instead and
 * there is nothing to collapse.
 */

"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { GroupNav } from "@/components/app/group-nav/group-nav";
import { GroupSummary } from "@/components/app/group-sidebar/group-summary";

const RAIL =
  "gap-space-md px-margin md:px-margin-tablet pt-space-lg pb-space-md lg:px-space-md lg:py-space-xl border-border/60 flex shrink-0 flex-col border-b lg:border-r lg:border-b-0";

type GroupSidebarProps = {
  uid: string;
  name: string;
  description: string | null;
  members: string | null;
  admin: boolean;
};

/** Renders a group's rail around its sections. */
export function GroupSidebar({
  uid,
  name,
  description,
  members,
  admin,
}: Readonly<GroupSidebarProps>) {
  const [collapsed, setCollapsed] = useState(false);
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div className={`${RAIL} ${collapsed ? "lg:w-20" : "lg:w-72"}`}>
      <GroupSummary
        name={name}
        description={description}
        members={members}
        admin={admin}
        collapsed={collapsed}
      />

      <GroupNav uid={uid} collapsed={collapsed} />

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
  );
}
