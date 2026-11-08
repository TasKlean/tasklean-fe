/**
 * Whether the trail is cut into days. A real checkbox under the paint, so the
 * keyboard works for free and the switch moves from CSS.
 */

import { SwitchTrack } from "@/components/common/switch-track/switch-track";

type DaySectionsToggleProps = {
  on: boolean;
  onFlip: () => void;
};

// `self-end` rather than a full-width label: the whole row would otherwise be
// a press target, which reads as a band across the page.
const CONTROL =
  "text-label-md text-muted-foreground has-[:focus-visible]:ring-ring gap-space-sm flex min-h-11 cursor-pointer items-center self-end rounded-md has-[:focus-visible]:ring-2";

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
