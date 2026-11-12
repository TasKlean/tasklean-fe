/**
 * Whether the trail is cut into days. A quiet press rather than a switch, with
 * its label saying what pressing it will do, like the one that opens a row's
 * changes: it sits at the end of the first day's rule, which is the line it is
 * about, where among the filters it read as a fourth filter.
 */

type DaySectionsToggleProps = {
  on: boolean;
  onFlip: () => void;
};

// The same underlined press a row uses for its changes, so the two read alike.
// `shrink-0`, because the rule beside it is what gives up the space.
const CONTROL =
  "text-label-sm text-muted-foreground hover:text-foreground py-space-xs shrink-0 underline underline-offset-2 transition-colors";

/** Renders the press that cuts the rows into days, or stops. */
export function DaySectionsToggle({ on, onFlip }: Readonly<DaySectionsToggleProps>) {
  return (
    <button type="button" onClick={onFlip} className={CONTROL}>
      {on ? "Ungroup by date" : "Group by date"}
    </button>
  );
}
