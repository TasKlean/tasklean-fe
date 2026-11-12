/**
 * The way back to the whole trail. A link like every other filter control, so
 * the server decides what the feed then holds, and it is drawn only while
 * something is narrowing the feed: there is nothing to clear otherwise.
 */

import { X } from "lucide-react";
import Link from "next/link";
import { narrowsTrail } from "@/lib/audit/filter/filter";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

type ClearFiltersProps = {
  // The path to the whole trail, which is this screen's path without a query.
  path: string;
  filter: AuditFilter;
};

// Pushed to the end of the column it sits in, so it tucks under the range pill
// on a wide screen and under the pills' own row on a phone.
const CLEAR =
  "text-label-md gap-space-xs px-space-xs text-muted-foreground hover:bg-muted hover:text-foreground ml-auto flex min-h-11 w-fit items-center rounded-full transition-colors";

/** Renders the press that takes every filter off, or nothing. */
export function ClearFilters({ path, filter }: Readonly<ClearFiltersProps>) {
  if (!narrowsTrail(filter)) return null;

  return (
    <Link href={path} className={CLEAR}>
      <X className="size-4 shrink-0" aria-hidden />
      Clear filters
    </Link>
  );
}
