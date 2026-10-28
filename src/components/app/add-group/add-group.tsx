/**
 * The two ways into a group, which is all there are: make one, or redeem a
 * code. There is no third, because a group admin cannot add anybody directly.
 */

import Link from "next/link";
import { KeyRound, Plus } from "lucide-react";

type AddGroupProps = {
  // Full-width stacked buttons for the empty state, inline ones beside a list.
  layout: "stacked" | "inline";
};

const PRIMARY =
  "bg-primary text-primary-foreground hover:bg-primary-strong shadow-level-1 text-label-lg focus-visible:ring-ring flex min-h-13 items-center justify-center gap-2 rounded-full px-6 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]";

const QUIET =
  "border-border/60 text-foreground hover:bg-muted text-label-lg focus-visible:ring-ring flex min-h-13 items-center justify-center gap-2 rounded-full border px-6 transition-colors focus-visible:ring-2 focus-visible:outline-none";

const LAYOUTS = {
  stacked: "gap-space-sm flex flex-col sm:flex-row",
  inline: "gap-space-sm flex flex-wrap",
} as const;

/** Renders the create and join links. */
export function AddGroup({ layout }: Readonly<AddGroupProps>) {
  return (
    <div className={LAYOUTS[layout]}>
      <Link href="/app/groups/new" className={PRIMARY}>
        <Plus className="size-4 shrink-0" aria-hidden />
        Create a group
      </Link>

      <Link href="/app/groups/join" className={QUIET}>
        <KeyRound className="size-4 shrink-0" aria-hidden />
        Join with a code
      </Link>
    </div>
  );
}
