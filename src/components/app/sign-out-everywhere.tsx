/**
 * The global sign-out. Behind a confirm step because it ends this browser's
 * session too, so the person pressing it is logging themselves out as well.
 */

"use client";

import { useActionState, useState } from "react";
import { Loader2, ShieldX } from "lucide-react";
import {
  type DeviceActionState,
  signOutEverywhereAction,
} from "@/app/(app)/app/settings/devices/actions";

const INITIAL: DeviceActionState = { error: null };

const BUTTON =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Renders the sign-out-everywhere control and its confirmation. */
export function SignOutEverywhere() {
  const [state, signOutEverywhere, pending] = useActionState(signOutEverywhereAction, INITIAL);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="border-border/60 pt-space-md gap-space-sm flex flex-col border-t">
      {confirming ? (
        <>
          <p className="text-body-md text-muted-foreground">
            This ends every session, including this one, and returns you to the sign-in screen.
          </p>

          <div className="gap-space-xs flex flex-wrap items-center">
            <form action={signOutEverywhere}>
              <button
                type="submit"
                disabled={pending}
                aria-busy={pending}
                className={`${BUTTON} bg-destructive-subtle text-destructive-subtle-foreground border-transparent hover:opacity-90`}
              >
                {pending ? (
                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                ) : (
                  <ShieldX className="size-4" aria-hidden />
                )}
                {pending ? "Signing out" : "Yes, sign out everywhere"}
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
        <div className="gap-space-sm flex flex-wrap items-center justify-between">
          <p className="text-body-md text-muted-foreground">
            Lost a device, or signed in somewhere you should not have?
          </p>

          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`${BUTTON} border-border/60 text-foreground hover:bg-muted`}
          >
            <ShieldX className="size-4" aria-hidden />
            Sign out everywhere
          </button>
        </div>
      )}

      {state.error ? (
        <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
