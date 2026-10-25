/**
 * The two things that act on every device at once. One component owns both,
 * because each confirmation replaces the row it was pressed from, so only one
 * of them may ever be open.
 */

"use client";

import { useActionState, useState } from "react";
import { ShieldX, Trash2 } from "lucide-react";
import {
  type DeviceActionState,
  removeAllDevicesAction,
  signOutEverywhereAction,
} from "@/app/(app)/app/settings/devices/actions/actions";
import { ConfirmAction } from "@/components/app/all-device-actions/confirm-action";
import { BUTTON } from "@/components/app/all-device-actions/all-device-actions.styles";

type Asked = "signOut" | "removeAll" | null;

const INITIAL: DeviceActionState = { error: null };

/** Renders signing out everywhere, removing every device, and their questions. */
export function AllDeviceActions() {
  const [signOutState, signOutEverywhere, signingOut] = useActionState(
    signOutEverywhereAction,
    INITIAL,
  );
  const [removeState, removeAll, removing] = useActionState(removeAllDevicesAction, INITIAL);
  const [asked, setAsked] = useState<Asked>(null);

  const error = signOutState.error ?? removeState.error;

  return (
    <div className="border-border/60 pt-space-md gap-space-sm flex flex-col border-t">
      {asked === "signOut" ? (
        <ConfirmAction
          question="This ends every session, including this one, and returns you to the sign-in screen."
          tone="neutral"
          label="Yes, sign out everywhere"
          pendingLabel="Signing out"
          icon={<ShieldX className="size-4" aria-hidden />}
          act={signOutEverywhere}
          pending={signingOut}
          onCancel={() => setAsked(null)}
        />
      ) : null}

      {asked === "removeAll" ? (
        <ConfirmAction
          question="Removing all devices will sign you out of all of them and forget them. To add devices back, sign in with them again."
          tone="destructive"
          label="Yes, remove all devices"
          pendingLabel="Removing"
          icon={<Trash2 className="size-4" aria-hidden />}
          act={removeAll}
          pending={removing}
          onCancel={() => setAsked(null)}
        />
      ) : null}

      {asked === null ? (
        <div className="gap-space-sm flex flex-wrap items-center justify-between">
          <p className="text-body-md text-muted-foreground">
            Lost a device, or signed in somewhere you should not have?
          </p>

          <div className="gap-space-xs flex flex-wrap items-center">
            <button
              type="button"
              onClick={() => setAsked("signOut")}
              className={`${BUTTON} border-border/60 text-foreground hover:bg-muted`}
            >
              <ShieldX className="size-4" aria-hidden />
              Sign out everywhere
            </button>

            <button
              type="button"
              onClick={() => setAsked("removeAll")}
              className={`${BUTTON} border-destructive/40 text-destructive hover:bg-destructive-subtle`}
            >
              <Trash2 className="size-4" aria-hidden />
              Remove all devices
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
