/**
 * Whether the trail is cut into days. A real checkbox under the paint, so the
 * keyboard works for free and the switch moves from CSS.
 */

import { SwitchTrack } from "@/components/common/switch-track/switch-track";

type DaySectionsToggleProps = {
  on: boolean;
  onFlip: () => void;
};

// Sized to its own label, or the whole line beside it would be a press target.
// `self-end` is for the phone, where it holds the end of the column under the
// filter; the row it shares at `sm` aligns it itself.
const CONTROL =
  "text-label-md text-muted-foreground has-[:focus-visible]:ring-ring gap-space-sm flex min-h-11 w-fit cursor-pointer items-center self-end rounded-md has-[:focus-visible]:ring-2 sm:self-auto";

/** Renders the switch that groups the rows by day. */
export function DaySectionsToggle({ on, onFlip }: Readonly<DaySectionsToggleProps>) {
  return (
    <label className={CONTROL}>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={onFlip}
        className="peer sr-only"
      />
      <SwitchTrack />
      Group by day
    </label>
  );
}
