/**
 * One labelled band of the group list. It renders nothing at all when it holds
 * no groups, so a reader who administers none never sees an empty heading.
 */

import { GroupCard } from "@/components/app/group-card/group-card";
import type { MyGroup } from "@/lib/groups/groups.types";
import { groupLabel } from "@/lib/groups/labels/labels";

type GroupSectionProps = {
  title: string;
  groups: readonly MyGroup[];
};

/** Renders a heading and the grid of cards under it. */
export function GroupSection({ title, groups }: Readonly<GroupSectionProps>) {
  if (groups.length === 0) return null;

  return (
    <section className="gap-space-sm flex flex-col">
      <h2 className="text-label-lg text-muted-foreground">{title}</h2>

      <ul className="gap-space-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          // `min-w-0`: a grid item's automatic minimum is its content, so one
          // unbreakable word would otherwise paint the card past its track.
          <li key={group.uid ?? groupLabel(group.name)} className="flex min-w-0">
            <GroupCard group={group} />
          </li>
        ))}
      </ul>
    </section>
  );
}
