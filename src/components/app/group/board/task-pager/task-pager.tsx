/**
 * Moving between the board's pages. Links rather than presses, because the
 * page is in the URL: a reader can bookmark page three and the back button
 * walks back through the pages they read.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type TaskPagerProps = {
  page: number;
  totalPages: number;
  totalTasks: number;
  // How many rows this page actually holds, which the last page cuts short.
  shown: number;
  // The page size the board answered with, rather than the backend's default
  // written out again here, where it would drift the moment that one changed.
  size: number;
  // Builds the URL for one page, with the rest of the filter kept.
  hrefFor: (page: number) => string;
};

const STEP =
  "text-label-md gap-space-xs px-space-md border-border/60 bg-card text-foreground hover:bg-muted flex min-h-11 items-center rounded-full border transition-colors";

// A dead end is drawn rather than hidden, so the row does not reflow as a
// reader walks to the last page.
const STEP_OFF =
  "text-label-md gap-space-xs px-space-md border-border/60 text-muted-foreground flex min-h-11 cursor-not-allowed items-center rounded-full border opacity-60";

/** Renders the count and the two steps, or just the count on a single page. */
export function TaskPager({
  page,
  totalPages,
  totalTasks,
  shown,
  size,
  hrefFor,
}: Readonly<TaskPagerProps>) {
  if (totalTasks === 0) return null;

  const first = (page - 1) * size + 1;
  const last = first + shown - 1;
  const word = totalTasks === 1 ? "task" : "tasks";

  return (
    <div className="gap-space-sm pt-space-xs flex flex-wrap items-center justify-between">
      <p className="text-label-md text-muted-foreground">
        {totalPages > 1
          ? `Showing ${first} to ${last} of ${totalTasks} ${word}`
          : `${totalTasks} ${word}`}
      </p>

      {totalPages > 1 ? (
        <div className="gap-space-xs flex items-center">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} rel="prev" className={STEP}>
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              Previous
            </Link>
          ) : (
            <span className={STEP_OFF} aria-hidden>
              <ChevronLeft className="size-4 shrink-0" />
              Previous
            </span>
          )}

          <p className="text-label-md text-muted-foreground px-space-xs">
            Page {page} of {totalPages}
          </p>

          {page < totalPages ? (
            <Link href={hrefFor(page + 1)} rel="next" className={STEP}>
              Next
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </Link>
          ) : (
            <span className={STEP_OFF} aria-hidden>
              Next
              <ChevronRight className="size-4 shrink-0" />
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
