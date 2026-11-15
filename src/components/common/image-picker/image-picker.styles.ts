/** The classes the picker's drop zone, square and presses share. */

// The zone is the drop target, so the dashed border is there at all times and
// only its colour changes: a border that appeared on a drag would shift
// everything inside it. The padding is pulled back out again so the label still
// lines up with the fields above, while the outline sits outside them.
const ZONE =
  "gap-space-sm p-space-sm -mx-space-sm flex flex-col rounded-2xl border-2 border-dashed transition-colors";

export const ZONE_IDLE = `${ZONE} border-transparent`;

export const ZONE_OVER = `${ZONE} border-primary bg-muted`;

// `relative` is what `fill` needs, and `fill` is what makes the picture fill
// the box: this is a grid whose row is content sized, so a height of 100% in it
// is indefinite and a tall photo is drawn at its own height instead.
const BOX =
  "bg-muted text-muted-foreground relative grid size-32 shrink-0 place-items-center overflow-hidden text-center";

// Each shape names its own radius rather than overriding a default one, since
// two radius utilities in one class list resolve in the stylesheet.
const RADIUS = { square: "rounded-xl", circle: "rounded-full" } as const;

export type PickerShape = keyof typeof RADIUS;

// The same pill a settings section's presses wear. Written again rather than
// imported, because a common component reaching into a feature's styles would
// be the wrong way round.
const PRESS =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const QUIET_PRESS = `${PRESS} border-border/60 text-foreground hover:bg-muted`;

export const REMOVE_PRESS = `${PRESS} border-destructive/40 text-destructive hover:bg-destructive-subtle`;

export const SPINNER = "size-4 motion-safe:animate-spin";

/**
 * Builds the classes for the preview box, which wears the shape the picture
 * will be drawn in so a reader sees what they are choosing.
 *
 * @param filled Whether there is a picture in it: an empty box is outlined in
 * dashes as the drop target it is, a full one in a hairline ring.
 */
export function previewBox(shape: PickerShape, filled: boolean): string {
  const edge = filled ? "ring-border/60 ring-1" : "border-border border-2 border-dashed";
  return `${BOX} ${RADIUS[shape]} ${edge}`;
}
