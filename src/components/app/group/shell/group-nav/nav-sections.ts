/**
 * A group's sections, in the order the rail shows them: the band at the top is
 * whichever area is open, so a section with sections of its own puts them where
 * Workspace sits and heads them with the way back. The band at the bottom is
 * the group's own administration, which is also the one a phone keeps behind
 * its bottom bar while the top band becomes the strip above the content.
 */

import {
  ArrowLeft,
  Bell,
  CircleCheckBig,
  Cog,
  Info,
  KeyRound,
  LogOut,
  Pencil,
  ScrollText,
  SlidersHorizontal,
  Tags,
  Trash2,
  Users,
} from "lucide-react";
import type {
  GroupNavItem,
  GroupNavSection,
} from "@/components/app/group/shell/group-nav/group-nav.types";
import { groupPath, openGroupArea } from "@/components/app/group/shell/group-nav/open-group-area";

/**
 * Builds the entry that leaves an area for the group's own path.
 *
 * @param group The group's path, which is the tasks.
 */
function backToTasks(group: string): GroupNavItem {
  return { href: group, label: "Back to tasks", icon: ArrowLeft, back: true };
}

/**
 * Lists the sections the overview holds.
 *
 * @param group The group's path, which every href is built from.
 */
function overviewItems(group: string): GroupNavItem[] {
  return [
    backToTasks(group),
    { href: `${group}/overview/information`, label: "Information", icon: Info },
    { href: `${group}/overview/members`, label: "Members", icon: Users },
    // Blocked rather than unwritten: the audit endpoint takes a numeric group
    // id the API never hands out, and its entries name nobody.
    { label: "Audit trail", icon: ScrollText, soon: true },
  ];
}

/**
 * Lists the sections a group's settings hold.
 *
 * @param group The group's path, which every href is built from.
 * @param admin Whether the reader administers this group, which is the three
 * sections that are the group's own rather than theirs.
 */
function settingsItems(group: string, admin: boolean): GroupNavItem[] {
  const mine: GroupNavItem[] = [
    backToTasks(group),
    { href: `${group}/settings/preferences`, label: "Preferences", icon: SlidersHorizontal },
    { href: `${group}/settings/notifications`, label: "Notifications", icon: Bell },
  ];

  if (!admin) return mine;

  return [
    ...mine,
    { href: `${group}/settings/details`, label: "Group details", icon: Pencil },
    { href: `${group}/settings/invite-code`, label: "Invite code", icon: KeyRound },
    { href: `${group}/settings/delete`, label: "Delete group", icon: Trash2, destructive: true },
  ];
}

/**
 * Picks the band that sits where Workspace does, which is the open area's own
 * sections wherever it has any.
 *
 * @param group The group's path.
 * @param pathname The path on screen, which is what says where we are.
 * @param admin Whether the reader administers this group.
 */
function openArea(group: string, pathname: string, admin: boolean): GroupNavSection {
  const area = openGroupArea(group, pathname);

  if (area === "settings") {
    return { label: "Group settings", phone: "strip", items: settingsItems(group, admin) };
  }

  if (area === "overview") {
    return { label: "Overview", phone: "strip", items: overviewItems(group) };
  }

  return {
    label: "Workspace",
    phone: "strip",
    items: [
      // The group's own path: tasks are what a group is for, so they are
      // what opening one shows, and the overview has a route of its own.
      { href: group, label: "Tasks", icon: CircleCheckBig },
      { href: `${group}/tags`, label: "Tags & Categories", icon: Tags, soon: true },
    ],
  };
}

/**
 * Lists a group's sections and the entries in each.
 *
 * @param uid The group in the URL, which every href is built from.
 * @param pathname The path on screen, which decides the top band.
 * @param admin Whether the reader administers this group.
 */
export function navSections(uid: string, pathname: string, admin: boolean): GroupNavSection[] {
  const group = groupPath(uid);

  return [
    openArea(group, pathname, admin),
    {
      label: "Administration",
      phone: "menu",
      items: [
        // Both point at the area rather than at a section of it, because each
        // one redirects to its first section and neither is ever the open path.
        { href: `${group}/overview`, label: "Overview", icon: Info },
        { href: `${group}/settings`, label: "Group settings", icon: Cog },
        // The roster is the only screen that knows which membership is yours,
        // so leaving lives there and this points at the band holding it.
        {
          href: `${group}/overview/members#leave-group`,
          label: "Leave group",
          icon: LogOut,
          destructive: true,
        },
      ],
    },
  ];
}
