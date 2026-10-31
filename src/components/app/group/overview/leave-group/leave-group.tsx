/**
 * Leaving, which is the roster's one action for your own membership. It lives
 * here because the roster is the only screen that knows which membership is
 * yours, and it confirms in place the way every other destructive button does.
 */

"use client";

import { useActionState, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import {
  leaveGroupAction,
  type MemberActionState,
} from "@/app/(app)/app/groups/[uid]/overview/members/actions/actions";
import {
  CANCEL_BUTTON,
  CONFIRM_BUTTON,
  LEAVE_BUTTON,
  SPINNER,
} from "@/components/app/group/overview/leave-group/leave-group.styles";

type LeaveGroupProps = {
  groupUid: string;
  memberUid: string;
  // An admin leaving is the same call, and the backend refuses the last one.
  admin: boolean;
};

const INITIAL: MemberActionState = { error: null };

/** Renders the way out of a group, and the question it asks first. */
export function LeaveGroup({ groupUid, memberUid, admin }: Readonly<LeaveGroupProps>) {
  const [state, leave, leaving] = useActionState(leaveGroupAction, INITIAL);
  const [confirming, setConfirming] = useState(false);

  return (
    <section
      id="leave-group"
      // The rail links here, so the heading clears the sticky header when it
      // lands rather than sitting under it.
      className="bg-card border-destructive/40 p-space-lg gap-space-sm flex scroll-mt-24 flex-col rounded-xl border"
    >
      <h3 className="text-label-lg text-foreground">Leave this group</h3>
      <p className="text-body-md text-muted-foreground max-w-prose">
        You lose access to its tasks straight away. Someone can invite you back with the
        group&apos;s code.
      </p>

      {admin ? (
        <p className="text-label-sm text-muted-foreground">
          A group keeps at least one admin, so make someone else an admin first if you are the only
          one.
        </p>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
          {state.error}
        </p>
      ) : null}

      {confirming ? (
        <div className="gap-space-xs flex flex-wrap items-center">
          <span className="text-label-sm text-destructive px-space-xs">Leave this group?</span>

          <form action={leave}>
            <input type="hidden" name="groupUid" value={groupUid} />
            <input type="hidden" name="memberUid" value={memberUid} />
            <button type="submit" disabled={leaving} aria-busy={leaving} className={CONFIRM_BUTTON}>
              {leaving ? <Loader2 className={SPINNER} aria-hidden /> : null}
              {leaving ? "Leaving" : "Leave group"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={leaving}
            className={CANCEL_BUTTON}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex">
          <button type="button" onClick={() => setConfirming(true)} className={LEAVE_BUTTON}>
            <LogOut className="size-4" aria-hidden />
            Leave group
          </button>
        </div>
      )}
    </section>
  );
}
