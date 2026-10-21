/**
 * Which classes put the track in its position. Separate from the switch because
 * the no-state case is a CSS answer and the rest is a React one.
 */

const FROM_CHECKBOX =
  "bg-input justify-start peer-checked:bg-primary peer-checked:justify-end peer-disabled:opacity-60";

/**
 * Picks the track's position.
 *
 * @param on Undefined where there is no React state to follow, which leaves it
 * to the checkbox beside it.
 */
export function positionFor(on: boolean | undefined): string {
  if (on === undefined) return FROM_CHECKBOX;
  return on ? "bg-primary justify-end" : "bg-input justify-start";
}
