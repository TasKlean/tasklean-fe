/**
 * The group a reader is inside, at the top of its rail: the picture, how many
 * are in it, where the reader stands, the name and what it is for. The heading
 * stays in the tree however the card is hidden, so the page never loses the
 * only `h1` it has.
 */

import { Users } from "lucide-react";
import { GroupAvatar } from "@/components/common/group-avatar/group-avatar";
import { GroupDescription } from "@/components/app/group/shell/group-sidebar/group-description";
import { memberCountLabel } from "@/lib/groups/labels/labels";

type GroupSummaryProps = {
  name: string;
  photoUrl: string | null;
  description: string | null;
  memberCount: number | null;
  admin: boolean;
  collapsed: boolean;
  // The reader is in an area with a menu of its own, so at `lg` the card gives
  // up its space to that menu and leaves only the heading behind.
  inArea: boolean;
};

// A card at every width: the picture, the chips and the name are one thing
// about one group, and on a phone an unboxed row of them read as three.
const CARD = "gap-space-xs bg-card border-border/60 p-space-md flex flex-col rounded-xl border";

// What the card gives up inside an area, at `lg` only. Every property the two
// states disagree about is dropped here in one place: `lg:p-0` beside
// `lg:p-space-md` resolves by Tailwind's own output order, and the padding is
// what won, leaving an empty 32px box behind. Measured.
const BARE_AT_LG = "lg:gap-0 lg:border-0 lg:bg-transparent lg:p-0";

const CHIP = "text-label-sm gap-1 flex shrink-0 items-center rounded-full px-2 py-0.5";

// The count wears the quieter of the two fills: it is a fact about the group,
// where the role is a fact about the reader and is what they look for.
const COUNT = `${CHIP} bg-secondary text-secondary-foreground`;

const ROLES = {
  admin: `${CHIP} bg-primary text-primary-foreground`,
  member: `${CHIP} bg-secondary text-secondary-foreground`,
} as const;

/** Renders a group's identity card. */
export function GroupSummary({
  name,
  photoUrl,
  description,
  memberCount,
  admin,
  collapsed,
  inArea,
}: Readonly<GroupSummaryProps>) {
  const members = memberCountLabel(memberCount ?? undefined);

  return (
    <section
      className={`${CARD} ${inArea ? BARE_AT_LG : ""} ${collapsed ? "lg:items-center" : ""}`}
    >
      {/* The chips go to the far end of the picture's row, which is the corner
          of the card. Decoration, all of it: the sentence at the end is what is
          announced, so none of the three is read out twice. */}
      <p
        className={`gap-space-sm flex items-center justify-between ${collapsed ? "lg:justify-center" : ""} ${inArea ? "lg:hidden" : ""}`}
      >
        <span aria-hidden>
          <GroupAvatar name={name} photoUrl={photoUrl} />
        </span>

        <span
          aria-hidden
          className={`gap-space-xs flex flex-wrap items-center justify-end ${collapsed ? "lg:hidden" : ""}`}
        >
          {memberCount === null ? null : (
            <span className={COUNT}>
              <Users className="size-3.5 shrink-0" aria-hidden />
              {memberCount}
            </span>
          )}

          <span className={admin ? ROLES.admin : ROLES.member}>{admin ? "Admin" : "Member"}</span>
        </span>

        <span className="sr-only">
          {members ? `${members}. ` : ""}
          {admin ? "You are an admin." : "You are a member."}
        </span>
      </p>

      <h1
        className={`text-headline-md lg:text-title-md text-foreground break-words ${collapsed || inArea ? "lg:sr-only" : ""}`}
      >
        {name}
      </h1>

      {/* Drawn in an open rail and nowhere else: below `lg` the card is the
          page's own header, and a description under the title pushes the strip
          and the section itself off the screen. */}
      {description ? (
        <GroupDescription
          description={description}
          shown={collapsed || inArea ? "hidden" : "hidden lg:flex"}
        />
      ) : null}
    </section>
  );
}
