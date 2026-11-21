/**
 * The board with nothing on it, which is two different situations: a household
 * that has not written a chore down yet, and a filter that matched none.
 */

import { CircleCheckBig, SearchX } from "lucide-react";
import Link from "next/link";

type NoTasksProps = {
  // Whether anything is hiding a chore the board could have shown.
  narrowed: boolean;
  // The path back to the whole board, for the way out of an empty filter.
  path: string;
};

const CARD =
  "bg-card border-border/60 p-space-xl gap-space-sm flex flex-col items-center rounded-xl border text-center";

const LINK = "text-label-md text-link min-h-11 inline-flex items-center hover:underline";

/** Renders the empty board, saying which kind of empty it is. */
export function NoTasks({ narrowed, path }: Readonly<NoTasksProps>) {
  const Icon = narrowed ? SearchX : CircleCheckBig;

  return (
    <div className={CARD}>
      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" aria-hidden />
      </span>

      <h3 className="text-title-md text-foreground">
        {narrowed ? "No chores match" : "No chores yet"}
      </h3>

      <p className="text-body-md text-muted-foreground max-w-prose">
        {narrowed
          ? "Nothing on this board fits what you asked for. Widen the filters, or clear them to see everything again."
          : "Nothing is written down yet. Add the first chore and it will show up here for everybody in the group."}
      </p>

      {narrowed ? (
        <Link href={path} className={LINK}>
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}
