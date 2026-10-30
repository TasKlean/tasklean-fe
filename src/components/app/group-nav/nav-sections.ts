/**
 * A group's sections, in the order the rail shows them: the work a member does
 * every day at the top, the group's own administration at the bottom, which is
 * also which of the two a phone scrolls and which it keeps behind the bottom
 * bar's More button. The overview and the members roster exist; the rest
 * becomes a link as it lands.
 */

import { CircleCheckBig, Cog, Info, LogOut, Tags, Users } from "lucide-react";
import type { GroupNavSection } from "@/components/app/group-nav/group-nav.types";

/**
 * Lists a group's sections and the entries in each.
 *
 * @param uid The group in the URL, which every href is built from.
 */
export function navSections(uid: string): GroupNavSection[] {
  const group = `/app/groups/${uid}`;

  return [
    {
      label: "Workspace",
      phone: "strip",
      items: [
        { href: `${group}/tasks`, label: "Tasks", icon: CircleCheckBig, soon: true },
        { href: `${group}/tags`, label: "Tags & Categories", icon: Tags, soon: true },
      ],
    },
    {
      label: "Administration",
      phone: "menu",
      items: [
        { href: group, label: "Overview", icon: Info },
        { href: `${group}/members`, label: "Members", icon: Users },
        { href: `${group}/settings`, label: "Settings", icon: Cog, soon: true },
        // The roster is the only screen that knows which membership is yours,
        // so leaving lives there and this points at the band holding it.
        {
          href: `${group}/members#leave-group`,
          label: "Leave group",
          icon: LogOut,
          destructive: true,
        },
      ],
    },
  ];
}
