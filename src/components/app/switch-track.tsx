/**
 * The switch itself, with no behaviour. Beside a checkbox it reads its state
 * from CSS, so the switch still moves with scripting off; given `on` it paints
 * what it is told, which is what the column switches need.
 */

type SwitchTrackProps = {
  // Left out when a checkbox beside it holds the state.
  on?: boolean;
};

const TRACK = "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors";

const FROM_CHECKBOX =
  "bg-input justify-start peer-checked:bg-primary peer-checked:justify-end peer-disabled:opacity-60";

/** Renders a switch in one of its two positions. */
export function SwitchTrack({ on }: SwitchTrackProps) {
  const position =
    on === undefined ? FROM_CHECKBOX : on ? "bg-primary justify-end" : "bg-input justify-start";

  return (
    <span className={`${TRACK} ${position}`}>
      <span className="bg-card size-5 rounded-full shadow-sm" />
    </span>
  );
}
