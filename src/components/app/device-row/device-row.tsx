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
import { DeviceName } from "@/components/app/device-row/device-name";
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

  // A smaller top inset than the sides: the name's 44px press target already
  // adds the rest, so the first line clears the edge like the other cards.
  return (
    <li className="bg-card border-border/60 p-space-lg pt-space-md gap-space-sm flex items-start rounded-xl border">
      {/* A box as tall as the name's own button, so the icon centres on the
          name rather than sitting above it. */}
      <span className="flex min-h-11 shrink-0 items-center">
        <Icon className={`text-muted-foreground size-5 ${dim}`} aria-hidden />
      </span>

      {/* One column beside the icon, so the buttons below line up with the name
          rather than with the card's own edge. */}
      <div className="gap-space-md flex min-w-0 flex-1 flex-col">
        <div className="gap-space-md flex items-start justify-between">
          <div className="gap-space-xs flex min-w-0 flex-col">
            {id === null ? (
              <span className={`text-label-lg text-foreground ${dim}`}>{label}</span>
            ) : (
              <DeviceName id={id} label={label} dim={dim} />
            )}

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
          </div>

          {/* Stacked on a phone, where two pills beside the name would truncate
              it, and pt-3 drops the first onto the name's own 44px line. */}
          <div className="gap-space-xs flex shrink-0 flex-col items-end pt-3 sm:min-h-11 sm:flex-row sm:items-center sm:pt-0">
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
              <span
                className={`text-label-sm bg-muted text-muted-foreground px-space-sm rounded-full py-0.5 ${dim}`}
              >
                Signed out
              </span>
            )}
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
            {error}
          </p>
        ) : null}

        {controls ? (
          <div className="gap-space-xs flex flex-wrap items-center">{controls}</div>
        ) : null}
      </div>
    </li>
  );
}
