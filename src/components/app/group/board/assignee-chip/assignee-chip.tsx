/**
 * Who a chore is for. An unassigned chore says so rather than showing
 * nothing: the pool is a state somebody can act on, where a blank is just a
 * gap. It is drawn exactly like an assigned one, down to the circle, so a
 * column of these reads as one column rather than as two kinds of thing.
 */

import { Avatar } from "@/components/common/avatar/avatar";
import { fullName } from "@/lib/users/name/name";
import type { MemberSummary } from "@/lib/tasks/tasks/tasks.types";

type AssigneeChipProps = {
  member: MemberSummary | undefined;
  // The circle alone until `sm`, for a row on a phone, which has no width for
  // a name beside the chore's own. The name is still read out.
  compact?: boolean;
};

// Taller than the other chips, because it holds a 32px avatar: the padding is
// what keeps the circle off the pill's own edge.
const SHELL =
  "text-label-sm bg-muted text-muted-foreground gap-1.5 flex max-w-full items-center rounded-full py-0.5 pl-0.5";

// The right-hand padding belongs to the name, so a chip drawn without one is
// a circle rather than a pill with a gap in it.
const ROOM = { full: "pr-2.5", tight: "pr-0.5 sm:pr-2.5" } as const;

/** Renders the member a chore is assigned to, or the pool. */
export function AssigneeChip({ member, compact = false }: Readonly<AssigneeChipProps>) {
  // The avatar falls back to a person where it is given no name and no
  // picture, which is the pool drawn for nothing.
  const held = Boolean(member?.memberUid);
  const name = fullName(member?.name, member?.lastName);

  return (
    <span className={`${SHELL} ${compact ? ROOM.tight : ROOM.full}`}>
      <Avatar
        name={held ? member?.name : undefined}
        lastName={held ? member?.lastName : undefined}
        photoUid={held ? member?.photoUid : undefined}
        photoUrl={held ? member?.photoUrl : undefined}
        size="xs"
      />

      <span className={compact ? "sr-only sm:not-sr-only sm:truncate" : "truncate"}>
        {held ? (name ?? "A member") : "Anyone"}
      </span>
    </span>
  );
}
