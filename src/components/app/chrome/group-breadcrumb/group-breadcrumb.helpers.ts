/**
 * The crumbs the header's trail shows, built from the path alone. Four at the
 * deepest: the list, the group, the area, and the section inside it. A group
 * opens on its tasks, which is an area with no sections, so that path stops at
 * three.
 *
 * The section list comes from `navSections` rather than a table of its own, so
 * the trail cannot disagree with the rail about what a section is called or
 * whether it is built yet.
 */

import { KeyRound, Plus } from "lucide-react";
import { openGroupUid } from "@/components/app/chrome/group-switcher/open-group-uid";
import { navSections } from "@/components/app/group/shell/group-nav/nav-sections";
import { groupPath, openGroupArea } from "@/components/app/group/shell/group-nav/open-group-area";
import type {
  Crumb,
  CrumbItem,
} from "@/components/app/chrome/group-breadcrumb/group-breadcrumb.types";
import type { MyGroup } from "@/lib/groups/groups.types";
import { groupLabel, MY_GROUPS_LABEL } from "@/lib/groups/labels/labels";
import { isGroupAdmin } from "@/lib/groups/role/role";

// The label each area wears in the trail. Tasks is the group's own path, so it
// reads as the work rather than as the rail's "Workspace" band.
const AREAS = {
  tasks: "Tasks",
  overview: "Overview",
  settings: "Group settings",
} as const;

/** The two ways into a group, which is all the list itself offers. */
function waysIn(): CrumbItem[] {
  return [
    { href: "/app/groups/new", label: "Create a group", icon: Plus },
    { href: "/app/groups/join", label: "Join a group", icon: KeyRound },
  ];
}

/**
 * Lists every group, with the open one checked. The two ways in are not here:
 * they belong to the list crumb beside it, so neither dropdown repeats the
 * other.
 *
 * @param groups Every group the caller is in.
 * @param uid The open group.
 */
function groupItems(groups: MyGroup[], uid: string): CrumbItem[] {
  return groups.map((group) => ({
    label: groupLabel(group.name),
    href: `/app/groups/${group.uid ?? ""}`,
    current: group.uid === uid,
  }));
}

/**
 * Lists a group's three areas, with the open one checked.
 *
 * @param group The group's own path, which the tasks are.
 * @param open The area the path is in.
 */
function areaItems(group: string, open: keyof typeof AREAS): CrumbItem[] {
  return [
    { label: AREAS.tasks, href: group, current: open === "tasks" },
    { label: AREAS.overview, href: `${group}/overview`, current: open === "overview" },
    { label: AREAS.settings, href: `${group}/settings`, current: open === "settings" },
  ];
}

/**
 * Lists the sections of the area a path is in, as the rail names them.
 *
 * @param uid The open group.
 * @param pathname The path on screen.
 * @param admin Whether the reader administers the group, which is three more
 * sections under its settings.
 */
function sectionItems(uid: string, pathname: string, admin: boolean): CrumbItem[] {
  const [area] = navSections(uid, pathname, admin);

  return (
    (area?.items ?? [])
      // The way back out is not one of the sections it sits above.
      .filter((item) => !item.back)
      .map((item) => ({
        label: item.label,
        icon: item.icon,
        href: item.soon ? undefined : item.href,
        current: item.href === pathname,
      }))
  );
}

/**
 * Builds the trail for a path.
 *
 * @param pathname The path on screen.
 * @param groups Every group the caller is in, which is the group crumb's list.
 * @returns One crumb per level, the list alone on any path outside a group.
 */
export function buildCrumbs(pathname: string, groups: MyGroup[]): Crumb[] {
  const uid = openGroupUid(pathname);
  const list: Crumb = {
    level: "list",
    label: MY_GROUPS_LABEL,
    href: "/app",
    opens: "Add a group",
    items: waysIn(),
  };

  if (!uid) return [list];

  const group = groups.find((candidate) => candidate.uid === uid);
  const path = groupPath(uid);
  const area = openGroupArea(path, pathname);
  const trail: Crumb[] = [
    list,
    {
      level: "group",
      // A group the list has not answered with is still the open group, so the
      // crumb names the path rather than dropping out of the trail.
      label: group ? groupLabel(group.name) : "Group",
      href: path,
      opens: "Switch group",
      items: groupItems(groups, uid),
    },
    {
      level: "area",
      label: AREAS[area],
      href: area === "tasks" ? path : `${path}/${area}`,
      opens: "Switch area",
      items: areaItems(path, area),
    },
  ];

  if (area === "tasks") return trail;

  const sections = sectionItems(uid, pathname, isGroupAdmin(group?.myRole));
  const open = sections.find((section) => section.current);

  // Only an area's own section earns the fourth crumb, so the moment before a
  // bare `/overview` redirects does not show an empty one.
  if (!open?.href) return trail;

  return [
    ...trail,
    {
      level: "section",
      label: open.label,
      href: open.href,
      opens: "Switch section",
      items: sections,
    },
  ];
}
