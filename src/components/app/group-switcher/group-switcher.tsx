/**
 * The group pill in the header: its left half is the way back into the group
 * you are in, its right half opens every other one. A disclosure of links
 * rather than a listbox, since it navigates rather than posting a value.
 */

"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { openGroupUid } from "@/components/app/group-switcher/open-group-uid";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";
import type { MyGroup } from "@/lib/groups/groups.types";
import { groupLabel } from "@/lib/groups/labels/labels";

type GroupSwitcherProps = {
  groups: MyGroup[];
};

const ITEM =
  "text-label-lg gap-space-sm px-space-md flex min-h-11 w-full items-center transition-colors";

/** Renders the open group's name, with every other group a press away. */
export function GroupSwitcher({ groups }: Readonly<GroupSwitcherProps>) {
  const pathname = usePathname();
  const { open, toggle, close, root, trigger } = useDisclosure();
  const panelId = useId();

  // Nothing to switch between, and `/app` already offers the two ways in, so a
  // trigger reading "Groups" over an almost empty panel would only be noise.
  if (groups.length === 0) return null;

  const uid = openGroupUid(pathname);
  const current = uid ? groups.find((group) => group.uid === uid) : undefined;
  const label = current ? groupLabel(current.name) : "Groups";
  // With no group open the name reads "Groups", so the list is what it points
  // at, which is also where that name belongs.
  const home = uid ? `/app/groups/${uid}` : "/app";

  return (
    <div ref={root} className="relative min-w-0">
      <div className="border-border/60 flex min-w-0 items-center rounded-full border">
        <Link
          href={home}
          className="text-label-lg text-foreground hover:bg-muted px-space-md flex min-h-11 min-w-0 items-center rounded-l-full transition-colors"
        >
          <span className="truncate">{label}</span>
        </Link>

        <button
          ref={trigger}
          type="button"
          aria-label="Switch group"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={toggle}
          className="border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-r-full border-l transition-colors"
        >
          <ChevronsUpDown className="size-4 shrink-0" aria-hidden />
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          className="bg-card border-border/60 shadow-level-3 py-space-xs absolute top-full left-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border"
        >
          <ul className="max-h-72 overflow-y-auto">
            {groups.map((group) => {
              const here = group.uid === uid;

              return (
                <li key={group.uid ?? group.name}>
                  <Link
                    href={`/app/groups/${group.uid ?? ""}`}
                    aria-current={here ? "page" : undefined}
                    onClick={close}
                    className={`${ITEM} ${here ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <span className="truncate">{groupLabel(group.name)}</span>
                    {here ? <Check className="ml-auto size-4 shrink-0" aria-hidden /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="border-border/60 mt-1 border-t pt-1">
            <Link
              href="/app/groups/new"
              onClick={close}
              className={`${ITEM} text-foreground hover:bg-muted`}
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              Create a group
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
