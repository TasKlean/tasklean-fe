/**
 * One device in the list, with its two destructive buttons. A client component
 * for the pending states and the confirm step; everything it shows is already
 * formatted by the page, so dates keep one locale and one source of truth.
 */

"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import {
  type DeviceActionState,
  removeDeviceAction,
  signOutDeviceAction,
} from "@/app/(app)/app/settings/devices/actions/actions";
import { ConfirmRemove } from "@/components/app/device-row/confirm-remove";
import { DeviceActions } from "@/components/app/device-row/device-actions";

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

/** Renders a device, its state, and the ways to end or remove it. */
export function DeviceRow({
  id,
  label,
  mobile,
  current,
  active,
  ipAddress,
  lastUsed,
}: Readonly<DeviceRowProps>) {
  const [signOutState, signOut, signingOut] = useActionState(signOutDeviceAction, INITIAL);
  const [removeState, remove, removing] = useActionState(removeDeviceAction, INITIAL);
  const [confirming, setConfirming] = useState(false);

  const Icon = mobile ? Smartphone : Monitor;
  const busy = signingOut || removing;
  const error = signOutState.error ?? removeState.error;
  // Only the description dims, never the buttons or an error: a dead session is
  // exactly when Remove matters most.
  const dim = active ? "" : "opacity-60";

  let controls: ReactNode = null;
  if (id !== null) {
    controls = confirming ? (
      <ConfirmRemove
        id={id}
        remove={remove}
        removing={removing}
        busy={busy}
        onCancel={() => setConfirming(false)}
      />
    ) : (
      <DeviceActions
        id={id}
        label={label}
        active={active}
        signOut={signOut}
        signingOut={signingOut}
        busy={busy}
        onRemove={() => setConfirming(true)}
      />
    );
  }

  return (
    <li className="bg-card border-border/60 p-space-md gap-space-md flex flex-col rounded-xl border sm:flex-row sm:items-start">
      {/* A row of its own, so the icon sits beside the name while the li stacks. */}
      <div className="gap-space-md flex min-w-0 sm:flex-1">
        <Icon className={`text-muted-foreground mt-0.5 size-5 shrink-0 ${dim}`} aria-hidden />

        <div className="gap-space-xs flex min-w-0 flex-1 flex-col">
          <div className={`gap-space-xs flex flex-wrap items-center ${dim}`}>
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
            <span className={`text-label-sm text-muted-foreground break-all ${dim}`}>
              Last seen from <span className="text-foreground font-bold">{ipAddress}</span>
            </span>
          ) : null}

          {lastUsed ? (
            <span className={`text-label-sm text-muted-foreground ${dim}`}>
              Last used <span className="text-foreground font-bold">{lastUsed}</span>
            </span>
          ) : null}

          {error ? (
            <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="gap-space-xs flex flex-wrap items-center sm:justify-end">{controls}</div>
    </li>
  );
}
