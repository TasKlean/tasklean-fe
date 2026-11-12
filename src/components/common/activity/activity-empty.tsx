/**
 * What a feed says when it has nothing to show. The line for a trail that is
 * simply empty is the screen's own, since what an empty feed means differs per
 * trail, and only the filtered case reads the same wherever it appears.
 */

type ActivityEmptyProps = {
  // The line for a feed nothing narrowed, which the screen writes.
  quiet: string;
  // Whether a filter is on, which is a likelier reason for an empty feed than
  // a quiet trail and is the one the reader can do something about.
  filtered: boolean;
};

const WRAPPER =
  "text-body-md text-muted-foreground bg-card border-border/60 p-space-lg rounded-xl border";

/** Renders the quiet state the reader's own view earns. */
export function ActivityEmpty({ quiet, filtered }: Readonly<ActivityEmptyProps>) {
  return <p className={WRAPPER}>{filtered ? "Nothing has been recorded for this yet." : quiet}</p>;
}
