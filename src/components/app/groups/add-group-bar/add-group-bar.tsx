/**
 * The two ways into a group where the page has no room for them: a bar fixed
 * over the end of the list, split in half, each side a plain link to its own
 * page. `lg:hidden`, because `AddGroup` carries the same two destinations above
 * the list once there is width for a row of buttons.
 */

import Link from "next/link";
import { KeyRound, Plus } from "lucide-react";

const BAR = "gap-space-sm bottom-space-md inset-x-margin fixed z-40 flex items-center lg:hidden";

// `flex-1` with `min-w-0` is what makes the halves equal, and the border is on
// both so only its colour differs: a border on one side alone is 2px of width
// the other does not pay, which left the halves 159 and 161 at 360px.
const HALF =
  "text-label-lg gap-space-sm px-space-sm shadow-level-3 flex min-h-13 min-w-0 flex-1 items-center justify-center rounded-full border transition-colors";

const CREATE = `${HALF} bg-primary text-primary-foreground hover:bg-primary-strong border-transparent`;

// Painted rather than merely outlined: the bar floats over the list, and a
// see-through half would have cards scrolling behind its label.
const JOIN = `${HALF} bg-card border-border/60 text-foreground hover:bg-muted`;

/** Renders the create and join links a phone gets at the end of the list. */
export function AddGroupBar() {
  return (
    <div className={BAR}>
      <Link href="/app/groups/new" className={CREATE}>
        <Plus className="size-5 shrink-0" aria-hidden />
        <span className="truncate">Create group</span>
      </Link>

      <Link href="/app/groups/join" className={JOIN}>
        <KeyRound className="size-5 shrink-0" aria-hidden />
        <span className="truncate">Join with code</span>
      </Link>
    </div>
  );
}
