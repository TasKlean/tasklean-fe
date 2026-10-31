/**
 * Issuing a new invite code. The press confirms in place, because the old code
 * stops working the moment this runs and whoever is holding it is locked out.
 * The new code arrives through the re-render, not through the action's state.
 */

"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useActionState, useState } from "react";
import {
  rotateInviteCodeAction,
  type GroupActionState,
} from "@/app/(app)/app/groups/[uid]/settings/actions/actions";
import {
  BUTTON,
  QUIET_BUTTON,
  SPINNER,
} from "@/components/app/group/settings/group-settings.styles";
import { CODE_ACTION } from "@/components/common/invite-code/invite-code.styles";

type RotateInviteCodeProps = {
  groupUid: string;
};

const INITIAL: GroupActionState = { error: null };

/** Renders the control that replaces a group's invite code. */
export function RotateInviteCode({ groupUid }: Readonly<RotateInviteCodeProps>) {
  const [state, rotate, rotating] = useActionState(rotateInviteCodeAction, INITIAL);
  const [confirming, setConfirming] = useState(false);

  // A fragment, because the row around this holds the code as well: the press
  // is one item in it and what the press opens takes a line of its own.
  return (
    <>
      {confirming ? (
        <div className="gap-space-sm flex w-full flex-col">
          {/* Neutral rather than red: nothing is lost, the code is replaced,
              so the warning is about the people holding the old one. */}
          <p className="text-body-md text-muted-foreground">
            The code you have already shared will stop working.
          </p>

          <div className="gap-space-xs flex flex-wrap items-center">
            <form action={rotate}>
              <input type="hidden" name="groupUid" value={groupUid} />
              <button
                type="submit"
                disabled={rotating}
                aria-busy={rotating}
                className={`${BUTTON} bg-secondary text-secondary-foreground border-transparent hover:opacity-90`}
              >
                {rotating ? (
                  <Loader2 className={SPINNER} aria-hidden />
                ) : (
                  <RefreshCw className="size-4" aria-hidden />
                )}
                {rotating ? "Issuing" : "Issue a new code"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={rotating}
              className={QUIET_BUTTON}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="New code"
          title="Issue a new code"
          className={CODE_ACTION}
        >
          <RefreshCw className="size-5" aria-hidden />
        </button>
      )}

      {state.error ? (
        <p role="alert" className="text-label-sm text-destructive-subtle-foreground w-full">
          {state.error}
        </p>
      ) : null}
    </>
  );
}
