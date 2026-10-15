/**
 * One device in the list, with its two destructive buttons. A client component
 * for the pending states and the confirm step; everything it shows is already
 * formatted by the page, so dates keep one locale and one source of truth.
 */

"use client";

import { useActionState, useState } from "react";
import { Loader2, LogOut, Monitor, Smartphone, Trash2 } from "lucide-react";
import {
  type DeviceActionState,
  removeDeviceAction,
  signOutDeviceAction,
} from "@/app/(app)/app/settings/devices/actions";

type DeviceRowProps = {
  // Null when the payload carried no id, which leaves nothing to act on.
  id: number | null;
  label: string;
  mobile: boolean;
  current: boolean;
  active: boolean;
  ipAddress: string | null;
  lastUsed: string | null;
};

const INITIAL: DeviceActionState = { error: null };

const BUTTON =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Renders a device, its state, and the ways to end or remove it. */
export function DeviceRow({
  id,
  label,
  mobile,
  current,
  active,
  ipAddress,
  lastUsed,
}: DeviceRowProps) {
  const [signOutState, signOut, signingOut] = useActionState(signOutDeviceAction, INITIAL);
  const [removeState, remove, removing] = useActionState(removeDeviceAction, INITIAL);
  const [confirming, setConfirming] = useState(false);

  const Icon = mobile ? Smartphone : Monitor;
  const busy = signingOut || removing;
  const error = signOutState.error ?? removeState.error;

  return (
    <li className="bg-card border-border/60 p-space-md gap-space-md flex flex-col rounded-xl border sm:flex-row sm:items-start">
      <Icon
        className={`text-muted-foreground mt-0.5 size-5 shrink-0 ${active ? "" : "opacity-60"}`}
        aria-hidden
      />

      <div className="gap-space-xs flex min-w-0 flex-col sm:flex-1">
        {/* Only the description dims, never the buttons or an error: a dead
            session is exactly when Remove matters most. */}
        <div className={`gap-space-xs flex flex-wrap items-center ${active ? "" : "opacity-60"}`}>
          <span className="text-label-lg text-foreground">{label}</span>

          {current ? (
            <span className="text-label-sm bg-primary text-primary-foreground px-space-sm rounded-full py-0.5">
              This device
            </span>
          ) : null}

          {active ? (
            <span className="text-label-sm bg-muted text-muted-foreground px-space-sm rounded-full py-0.5">
              Signed in
            </span>
          ) : (
            <span className="text-label-sm text-muted-foreground">Signed out</span>
          )}
        </div>

        {ipAddress ? (
          <span
            className={`text-label-sm text-muted-foreground break-all ${active ? "" : "opacity-60"}`}
          >
            Last seen from {ipAddress}
          </span>
        ) : null}

        {lastUsed ? (
          <span className={`text-label-sm text-muted-foreground ${active ? "" : "opacity-60"}`}>
            Last used {lastUsed}
          </span>
        ) : null}

        {error ? (
          <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
            {error}
          </p>
        ) : null}
      </div>

      <div className="gap-space-xs flex flex-wrap items-center sm:justify-end">
        {id === null ? null : confirming ? (
          <>
            <span className="text-label-sm text-muted-foreground px-space-xs">Remove it?</span>

            <form action={remove}>
              <input type="hidden" name="deviceId" value={id} />
              <button
                type="submit"
                disabled={busy}
                aria-busy={removing}
                className={`${BUTTON} bg-destructive-subtle text-destructive-subtle-foreground border-transparent hover:opacity-90`}
              >
                {removing ? (
                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                ) : null}
                {removing ? "Removing" : "Remove"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className={`${BUTTON} border-border/60 text-muted-foreground hover:bg-muted`}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {active ? (
              <form action={signOut}>
                <input type="hidden" name="deviceId" value={id} />
                <button
                  type="submit"
                  disabled={busy}
                  aria-busy={signingOut}
                  className={`${BUTTON} border-border/60 text-foreground hover:bg-muted`}
                >
                  {signingOut ? (
                    <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                  ) : (
                    <LogOut className="size-4" aria-hidden />
                  )}
                  {signingOut ? "Signing out" : "Sign out"}
                </button>
              </form>
            ) : null}

            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy}
              aria-label={`Remove ${label}`}
              className={`${BUTTON} border-border/60 text-muted-foreground hover:bg-muted`}
            >
              <Trash2 className="size-4" aria-hidden />
              Remove
            </button>
          </>
        )}
      </div>
    </li>
  );
}
