/**
 * The two things that can be done to a device. Sign out only appears for a live
 * session, because ending one that has already ended does nothing.
 */

import { Loader2, LogOut, Trash2 } from "lucide-react";
import { BUTTON, SPINNER } from "@/components/app/device-row/device-row.styles";

type DeviceActionsProps = {
  id: number;
  label: string;
  active: boolean;
  signOut: (formData: FormData) => void;
  signingOut: boolean;
  busy: boolean;
  onRemove: () => void;
};

/** Renders the two things that can be done to a device. */
export function DeviceActions({
  id,
  label,
  active,
  signOut,
  signingOut,
  busy,
  onRemove,
}: Readonly<DeviceActionsProps>) {
  return (
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
              <Loader2 className={SPINNER} aria-hidden />
            ) : (
              <LogOut className="size-4" aria-hidden />
            )}
            {signingOut ? "Signing out" : "Sign out"}
          </button>
        </form>
      ) : null}

      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        aria-label={`Remove ${label}`}
        className={`${BUTTON} border-destructive/40 text-destructive hover:bg-destructive-subtle`}
      >
        <Trash2 className="size-4" aria-hidden />
        Remove
      </button>
    </>
  );
}
