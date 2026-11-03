/**
 * Where the reader stands in a group, as a filled pill. Both fills are blue and
 * on palette: `primary` is the slate the brand is built on and `secondary` the
 * pale blue beside it, so an admin reads as the stronger of the two without
 * either one becoming a warning.
 */

type RoleChipProps = {
  admin: boolean;
};

const CHIP = "text-label-sm gap-1 flex shrink-0 items-center rounded-full px-2 py-0.5";

const TONE = {
  admin: `${CHIP} bg-primary text-primary-foreground`,
  member: `${CHIP} bg-secondary text-secondary-foreground`,
} as const;

/** Renders the reader's role in a group. */
export function RoleChip({ admin }: Readonly<RoleChipProps>) {
  return <span className={admin ? TONE.admin : TONE.member}>{admin ? "Admin" : "Member"}</span>;
}
