/**
 * The line above a trail pinned to one entity, and the way back to all of it.
 * It appears only for a ref, since a kind of thing is already named by the chip
 * that is marked current.
 */

import Link from "next/link";
import { X } from "lucide-react";
import { subjectLabel } from "@/lib/audit/filter/filter";
import type { AuditFilterType } from "@/lib/audit/filter/filter.types";

type ActivitySubjectProps = {
  type: AuditFilterType;
  // What the entity is called, where the screen could resolve it.
  name: string | null;
  // The path to the whole trail, which is this path without its query.
  path: string;
};

/** Renders what the feed is pinned to, and the press that unpins it. */
export function ActivitySubject({ type, name, path }: Readonly<ActivitySubjectProps>) {
  return (
    <div className="gap-space-sm bg-muted p-space-sm pl-space-md flex flex-wrap items-center justify-between rounded-full">
      <p className="text-body-md text-muted-foreground min-w-0">
        Showing {subjectLabel(type, name)}
      </p>

      <Link
        href={path}
        className="text-label-md gap-space-xs px-space-md text-foreground hover:bg-card flex min-h-11 items-center rounded-full transition-colors"
      >
        <X className="size-4 shrink-0" aria-hidden />
        Show all
      </Link>
    </div>
  );
}
