/**
 * What the feed says when it has nothing to show. A member's rows are narrowed
 * by the backend, so an empty feed is correct for them in a busy household and
 * may never read as "nothing happened": that would be an outright lie.
 */

type ActivityEmptyProps = {
  admin: boolean;
};

/** Renders the quiet state the reader's own view earns. */
export function ActivityEmpty({ admin }: Readonly<ActivityEmptyProps>) {
  return (
    <p className="text-body-md text-muted-foreground bg-card border-border/60 p-space-lg rounded-xl border">
      {admin
        ? "Nothing has happened in this group yet."
        : "Nothing here you can see yet. You will see what you do in this group, and what happens to the things you make."}
    </p>
  );
}
