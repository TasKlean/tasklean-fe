/**
 * The unlink control for a linked Google account. Behind a confirm step, and
 * refused outright without a password, which is the one case where unlinking
 * would leave no way back into the account.
 */

"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, Unlink } from "lucide-react";
import {
  type ConnectedAccountsActionState,
  unlinkGoogleAction,
} from "@/app/(app)/app/settings/connected-accounts/actions/actions";

type UnlinkGoogleProps = {
  // With no password set, Google is the only way in and the backend refuses.
  canUnlink: boolean;
};

const INITIAL: ConnectedAccountsActionState = { error: null };

const BLOCKED_ID = "unlink-google-blocked";

const BUTTON =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Renders the unlink control and its confirmation. */
export function UnlinkGoogle({ canUnlink }: Readonly<UnlinkGoogleProps>) {
  const [state, unlink, pending] = useActionState(unlinkGoogleAction, INITIAL);
  const [confirming, setConfirming] = useState(false);

  if (!canUnlink) {
    return (
      <div className="gap-space-sm flex flex-col">
        {/* A dead button rather than prose alone, so the copy reads as the
            reason this control is unavailable rather than as a stray notice. */}
        <button
          type="button"
          disabled
          aria-describedby={BLOCKED_ID}
          className={`${BUTTON} border-destructive/40 text-destructive w-fit`}
        >
          <Unlink className="size-4" aria-hidden />
          Unlink
        </button>

        <p id={BLOCKED_ID} className="text-label-sm text-muted-foreground">
          Google is the only way into this account right now.{" "}
          <Link
            href="/app/settings/password"
            className="text-link hover:text-primary-strong font-semibold underline-offset-4 hover:underline"
          >
            Set a password
          </Link>{" "}
          before unlinking it.
        </p>
      </div>
    );
  }

  return (
    <div className="gap-space-sm flex flex-col">
      {confirming ? (
        <>
          <p className="text-body-md text-destructive">
            You will sign in with your email address and password from now on.
          </p>

          <div className="gap-space-xs flex flex-wrap items-center">
            <form action={unlink}>
              <button
                type="submit"
                disabled={pending}
                aria-busy={pending}
                className={`${BUTTON} bg-destructive-subtle text-destructive-subtle-foreground border-transparent hover:opacity-90`}
              >
                {pending ? (
                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                ) : (
                  <Unlink className="size-4" aria-hidden />
                )}
                {pending ? "Unlinking" : "Yes, unlink Google"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className={`${BUTTON} border-border/60 text-muted-foreground hover:bg-muted`}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`${BUTTON} border-destructive/40 text-destructive hover:bg-destructive-subtle w-fit`}
        >
          <Unlink className="size-4" aria-hidden />
          Unlink
        </button>
      )}

      {state.error ? (
        <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
