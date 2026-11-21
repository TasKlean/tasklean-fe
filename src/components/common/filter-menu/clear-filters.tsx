/**
 * The way back to an unfiltered list. A link like every other filter control,
 * so the server decides what the list then holds, and it is drawn only while
 * something is narrowing it: there is nothing to clear otherwise.
 *
 * Takes the verdict rather than a filter, because each list's own module is
 * what knows which of its axes hide anything.
 */

import { X } from "lucide-react";
import Link from "next/link";

type ClearFiltersProps = {
  // The path to the whole list, which is this screen's path without a query.
  path: string;
  // Whether anything is hiding a row the list could have shown.
  narrowed: boolean;
};

// Pushed to the end of the column it sits in, so it tucks under the last pill
// on a wide screen and under the pills' own row on a phone.
const CLEAR =
  "text-label-md gap-space-xs px-space-xs text-muted-foreground hover:bg-muted hover:text-foreground ml-auto flex min-h-11 w-fit items-center rounded-full transition-colors";

/** Renders the press that takes every filter off, or nothing. */
export function ClearFilters({ path, narrowed }: Readonly<ClearFiltersProps>) {
  if (!narrowed) return null;

  return (
    <Link href={path} className={CLEAR}>
      <X className="size-4 shrink-0" aria-hidden />
      Clear filters
    </Link>
  );
}
