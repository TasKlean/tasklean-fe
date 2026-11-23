/**
 * The one thing the header offers rather than navigates to. Drawn only inside a
 * group, since a chore has nowhere to go without one.
 *
 * A link to the board, because the form belongs to that screen: pressed from a
 * group's other screens it takes the reader there with `?task=new` on the URL,
 * which is what opens the panel on arrival.
 *
 * A phone does not get it: the header there is the brand, the group and the
 * account, and a fourth control crowds all three. The bottom bar has it.
 */

"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { openGroupUid } from "@/components/app/chrome/group-switcher/open-group-uid";
import { addTaskHref } from "@/lib/tasks/filter/filter";

const PRESS =
  "bg-primary text-primary-foreground hover:bg-primary-strong focus-visible:ring-ring gap-space-xs px-space-sm hidden min-h-11 min-w-11 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none sm:flex";

/** Renders the add-task control, on a group's screens only. */
export function AddTaskButton() {
  const pathname = usePathname();
  const search = useSearchParams();

  const uid = openGroupUid(pathname);

  if (!uid) return null;

  return (
    <Link href={addTaskHref(uid, pathname, search.toString())} className={PRESS}>
      <Plus className="size-5 shrink-0" aria-hidden />
      <span className="text-label-lg hidden sm:inline">Add task</span>
    </Link>
  );
}
