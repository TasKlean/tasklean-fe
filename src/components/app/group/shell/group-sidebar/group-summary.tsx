/**
 * The group a reader is inside, at the top of its rail: the picture, the name
 * beside it, how many are in it, where the reader stands, and what it is for.
 * The heading stays in the tree however the card is hidden, so the page never
 * loses the only `h1` it has.
 *
 * A grid rather than a column, because the picture spans the two rows beside it
 * and the description spans both columns under them. One arrangement at every
 * width, so the collapsed rail and an area are the only two states it has.
 */

import { Users } from "lucide-react";
import { GroupAvatar } from "@/components/common/group-avatar/group-avatar";
import { GroupDescription } from "@/components/app/group/shell/group-sidebar/group-description";
import { GroupName } from "@/components/app/group/shell/group-sidebar/group-name";
import { RoleChip } from "@/components/common/role-chip/role-chip";
import { memberCountLabel } from "@/lib/groups/labels/labels";

type GroupSummaryProps = {
  name: string;
  photoUid: string | null;
  description: string | null;
  memberCount: number | null;
  admin: boolean;
  collapsed: boolean;
  // The reader is in an area with a menu of its own, so at `lg` the card gives
  // up its space to that menu and leaves only the heading behind.
  inArea: boolean;
};

// A card at every width: the picture, the chips and the name are one thing
// about one group, and on a phone an unboxed row of them read as three. The
// second column takes `minmax(0,1fr)` so a long name can be clipped rather
// than widening the track it sits in.
const CARD =
  "gap-x-space-sm gap-y-space-xs bg-card border-border/60 p-space-md grid grid-cols-[auto_minmax(0,1fr)] items-center rounded-xl border";

// What the card gives up inside an area, at `lg` only. Every property the two
// states disagree about is dropped here in one place: `lg:p-0` beside
// `lg:p-space-md` resolves by Tailwind's own output order, and the padding is
// what won, leaving an empty 32px box behind. Measured.
const BARE_AT_LG = "lg:gap-0 lg:border-0 lg:bg-transparent lg:p-0";

// Collapsed, the picture is all that is left, so the second track goes with the
// rest: centring inside a two-column grid would centre it in its own `auto`
// track, which is the picture's own width, rather than in the rail.
const NARROW_AT_LG = "lg:grid-cols-1 lg:justify-items-center";

// The picture holds both of the rows beside it, which is what puts the name and
// the chips to its right. The same at every width: a square with nothing against
// it reads far larger than the same square with two rows of text beside it.
const PICTURE = "col-start-1 row-span-2 row-start-1";

const CHIPS = "col-start-2 row-start-2";

const NAME = "col-start-2 row-start-1";

// The count wears the quieter of the two fills: it is a fact about the group,
// where the role is a fact about the reader and is what they look for.
const COUNT =
  "text-label-sm gap-1 bg-secondary text-secondary-foreground flex shrink-0 items-center rounded-full px-2 py-0.5";

/** Renders a group's identity card. */
export function GroupSummary({
  name,
  photoUid,
  description,
  memberCount,
  admin,
  collapsed,
  inArea,
}: Readonly<GroupSummaryProps>) {
  const members = memberCountLabel(memberCount ?? undefined);
  // Both states leave the chips out and the heading announced only. They differ
  // on the picture: collapsed is still about the group, so it keeps it, where an
  // area hands its space to the menu that replaced it.
  const stripped = collapsed || inArea;

  return (
    <section className={`${CARD} ${inArea ? BARE_AT_LG : ""} ${collapsed ? NARROW_AT_LG : ""}`}>
      {/* Decoration, both of them: the sentence below is what is announced, so
          neither the count nor the role is read out twice. */}
      <span aria-hidden className={`${PICTURE} ${inArea ? "lg:hidden" : ""}`}>
        <GroupAvatar name={name} photoUid={photoUid} size="card" />
      </span>

      <span
        aria-hidden
        className={`${CHIPS} gap-space-xs flex flex-wrap items-center ${stripped ? "lg:hidden" : ""}`}
      >
        {memberCount === null ? null : (
          <span className={COUNT}>
            <Users className="size-3.5 shrink-0" aria-hidden />
            {memberCount}
          </span>
        )}

        <RoleChip admin={admin} />
      </span>

      {/* Out of flow, so it takes no cell of the grid. */}
      <span className="sr-only">
        {members ? `${members}. ` : ""}
        {admin ? "You are an admin." : "You are a member."}
      </span>

      <h1 className={`${NAME} min-w-0`}>
        <GroupName
          name={name}
          className={`text-headline-md lg:text-title-md text-foreground ${stripped ? "lg:sr-only" : ""}`}
        />
      </h1>

      {/* Drawn in an open rail and nowhere else: below `lg` the card is the
          page's own header, and a description under the title pushes the strip
          and the section itself off the screen. */}
      {description ? (
        <GroupDescription
          description={description}
          shown={stripped ? "hidden" : "col-span-2 row-start-3 hidden lg:flex"}
        />
      ) : null}
    </section>
  );
}
