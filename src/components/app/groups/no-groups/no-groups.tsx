/**
 * Where a new account lands. `/mine` is empty for everyone who has just
 * registered, and nothing else in the app works until they are in a group, so
 * this is onboarding rather than an empty list.
 */

import { Users } from "lucide-react";
import { AddGroup } from "@/components/app/groups/add-group/add-group";

/** Renders the create-or-join choice an account with no groups gets. */
export function NoGroups() {
  return (
    <div className="bg-card border-border/60 p-space-xl gap-space-md flex flex-col items-start rounded-xl border">
      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Users className="size-6" aria-hidden />
      </span>

      <div className="gap-space-xs flex flex-col">
        <h2 className="text-headline-sm text-foreground">You are not in a group yet</h2>
        <p className="text-body-md text-muted-foreground max-w-prose">
          A group is the household you share chores with. Make one and send the invite code to the
          people you live with, or redeem a code somebody already sent you.
        </p>
      </div>

      <AddGroup layout="stacked" />
    </div>
  );
}
