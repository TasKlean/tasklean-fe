/**
 * The heading over the people who have left, in a filter menu's panel. The
 * roster sorts them last, so one divider labels the whole block instead of a
 * note on every row. Hidden from assistive tech, which hears each row say it.
 */

const LABEL = "Left the group";

const LINE = "bg-border/60 h-px flex-1";

/** Renders the hairline and the label that open the block. */
export function FormerDivider() {
  return (
    <li aria-hidden className="gap-space-sm px-space-md my-space-xs flex items-center">
      <span className={LINE} />
      <span className="text-label-sm text-muted-foreground shrink-0">{LABEL}</span>
      <span className={LINE} />
    </li>
  );
}
