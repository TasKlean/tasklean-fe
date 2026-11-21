/**
 * Who a chore is for. An unassigned chore says so rather than showing nothing:
 * the pool is a state somebody can act on, where a blank is just a gap.
 */

import { UserRound } from "lucide-react";
import { Avatar } from "@/components/common/avatar/avatar";
import { fullName } from "@/lib/users/name/name";
import type { MemberSummary } from "@/lib/tasks/tasks/tasks.types";

type AssigneeChipProps = {
  member: MemberSummary | undefined;
};

// Taller than the other chips, because it holds a 32px avatar: the padding is
// what keeps the circle off the pill's own edge.
const SHELL =
  "text-label-sm bg-muted text-muted-foreground gap-1.5 flex max-w-full items-center rounded-full py-0.5 pr-2.5 pl-0.5";

const EMPTY =
  "text-label-sm bg-muted text-muted-foreground gap-1 flex items-center rounded-full px-2 py-0.5";

/** Renders the member a chore is assigned to, or the pool. */
export function AssigneeChip({ member }: Readonly<AssigneeChipProps>) {
  const name = fullName(member?.name, member?.lastName);

  if (!member?.memberUid) {
    return (
      <span className={EMPTY}>
        <UserRound className="size-3.5 shrink-0" aria-hidden />
        Anyone
      </span>
    );
  }

  return (
    <span className={SHELL}>
      <Avatar
        name={member.name}
        lastName={member.lastName}
        photoUid={member.photoUid}
        photoUrl={member.photoUrl}
        size="xs"
      />
      <span className="truncate">{name ?? "A member"}</span>
    </span>
  );
}
