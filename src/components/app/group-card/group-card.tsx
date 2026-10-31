/**
 * One group on the list, as a card that is entirely a link. The admin chip is
 * outlined rather than filled: `bg-muted` is what every input is painted in, so
 * a filled grey pill beside a title reads as a disabled field.
 *
 * Every card is the same height: the grid gives equal widths already, and the
 * description's two lines are reserved rather than drawn only when filled.
 */

import Link from "next/link";
import { Users } from "lucide-react";
import { GroupAvatar } from "@/components/app/group-avatar/group-avatar";
import type { MyGroup } from "@/lib/groups/groups.types";
import { groupLabel, joinedLabel, memberCountLabel } from "@/lib/groups/labels/labels";
import { isGroupAdmin } from "@/lib/groups/role/role";

type GroupCardProps = {
  group: MyGroup;
};

/** Renders a group as a card linking to it. */
export function GroupCard({ group }: Readonly<GroupCardProps>) {
  const members = memberCountLabel(group.memberCount);
  const joined = joinedLabel(group.dateJoined);
  const description = group.description?.trim();

  return (
    <Link
      href={`/app/groups/${group.uid ?? ""}`}
      // `w-full` beside `h-full`: the row it sits in is a flex container, so
      // without it the card is only as wide as its own text.
      className="bg-card border-border/60 p-space-lg gap-space-sm hover:border-border hover:shadow-level-1 focus-visible:ring-ring flex h-full min-h-13 w-full flex-col rounded-xl border transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="gap-space-xs flex items-start justify-between">
        <span className="gap-space-sm flex min-w-0 items-center">
          <span aria-hidden>
            <GroupAvatar name={groupLabel(group.name)} photoUrl={group.photoUrl} />
          </span>
          <span className="text-title-md text-foreground min-w-0 break-words">
            {groupLabel(group.name)}
          </span>
        </span>

        {isGroupAdmin(group.myRole) ? (
          <span className="text-label-sm text-muted-foreground border-border/60 shrink-0 rounded-full border px-2 py-0.5">
            Admin
          </span>
        ) : null}
      </div>

      {/* The two lines are reserved whether or not there is a description, so
          a card is the same size as the one beside it either way. */}
      <span className="text-body-md text-muted-foreground line-clamp-2 min-h-11 break-words">
        {description}
      </span>

      <span className="text-label-md text-muted-foreground gap-space-xs mt-auto flex flex-wrap items-center">
        <Users className="size-4 shrink-0" aria-hidden />
        {members ?? "Members"}
        {joined ? <span aria-hidden>·</span> : null}
        {joined}
      </span>
    </Link>
  );
}
