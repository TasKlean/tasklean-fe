/** What the list says when the query hides every group, with the way back. */

import Link from "next/link";

/** Renders the empty result of a search or a role box. */
export function NoMatches() {
  return (
    <div className="bg-card border-border/60 p-space-lg gap-space-sm flex flex-col items-start rounded-xl border">
      <p className="text-body-md text-muted-foreground">No group matches what you searched for.</p>

      {/* A link to the bare path rather than a button clearing each control:
          the URL is the query, so dropping it is the whole reset. */}
      <Link
        href="/app"
        className="text-label-md border-border/60 text-foreground hover:bg-muted px-space-md flex min-h-11 items-center rounded-full border transition-colors"
      >
        Clear the filter
      </Link>
    </div>
  );
}
