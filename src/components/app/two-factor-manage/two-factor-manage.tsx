/**
 * What an account with a second factor can do to it: replace the recovery
 * codes, or turn it off. Both confirm in place, and both can hand back
 * something that exists nowhere else, so neither closes on its own.
 */

"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldOff } from "lucide-react";
import {
  disableAction,
  regenerateCodesAction,
} from "@/app/(app)/app/settings/two-factor/actions/actions";
import type { ConfirmState } from "@/app/(app)/app/settings/two-factor/actions/actions.types";
import { RecoveryCodes } from "@/components/app/recovery-codes/recovery-codes";
import { TwoFactorConfirm } from "@/components/app/two-factor-confirm";
import { FormNotice } from "@/components/common/form-notice";

type TwoFactorManageProps = {
  // Whether the factor is still on. The component renders anyway, because it
  // may be holding the codes or the notice from a second ago.
  enabled: boolean;
  // With a password set, both operations need it as well as a code.
  passwordSet: boolean;
  // Where "I have saved them" goes with no JavaScript.
  doneHref: string;
};

const NOTHING: ConfirmState = { error: null };

const PANEL = "border-border/60 pt-space-md gap-space-md flex flex-col border-t";

const LEAD = "text-body-md text-muted-foreground";

const BUTTON =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors";

/** Renders the two things that can be done to a factor that is already on. */
export function TwoFactorManage({
  enabled,
  passwordSet,
  doneHref,
}: Readonly<TwoFactorManageProps>) {
  const [codes, regenerate] = useActionState(regenerateCodesAction, NOTHING);
  const [off, disable] = useActionState(disableAction, NOTHING);
  const [open, setOpen] = useState<"codes" | "disable" | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const newCodes = codes.recoveryCodes ?? [];

  /** Closes the codes and asks the server for the count they just changed. */
  function finish() {
    setSaved(true);
    setOpen(null);
    router.refresh();
  }

  // Turning it off reseals the session, which re-renders this page with the
  // factor gone. Unmounting here would take the confirmation with it.
  if (!enabled && !off.done) return null;

  if (off.done) {
    return (
      <div className={PANEL}>
        <FormNotice tone="success">
          Two-factor is off. Signing in asks for your password only, your recovery codes are gone,
          and your other devices have been signed out.
        </FormNotice>
      </div>
    );
  }

  if (codes.done && !saved) {
    return (
      <div className={PANEL}>
        <FormNotice tone="success">
          These replace every code you had before, so the old ones no longer work.
        </FormNotice>

        <div className="gap-space-xs flex flex-col">
          <h3 className="text-title-md text-foreground">Save your new recovery codes</h3>
          <p className={LEAD}>
            Each one works once, and they are the only way in if you lose your phone. This is the
            one time they are shown.
          </p>
        </div>

        <RecoveryCodes codes={newCodes} doneHref={doneHref} onDone={finish} />
      </div>
    );
  }

  if (open === "codes") {
    return (
      <div className={PANEL}>
        <div className="gap-space-xs flex flex-col">
          <h3 className="text-title-md text-foreground">Get new recovery codes</h3>
          <p className={LEAD}>
            A new set of ten replaces the codes you have now. Confirm with a code from your app, or
            with one of the codes being replaced.
          </p>
        </div>

        <TwoFactorConfirm
          state={codes}
          action={regenerate}
          passwordSet={passwordSet}
          submitLabel="Get new codes"
          pendingLabel="Making them…"
          notice={
            <FormNotice tone="info">
              The codes you have now stop working the moment the new ones appear, and the new ones
              are shown once.
            </FormNotice>
          }
          onCancel={() => setOpen(null)}
        />
      </div>
    );
  }

  if (open === "disable") {
    return (
      <div className={PANEL}>
        <div className="gap-space-xs flex flex-col">
          <h3 className="text-title-md text-foreground">Turn off two-factor</h3>
          <p className={LEAD}>
            Your password alone will get into your account again. Confirm with a code from your app,
            or with a recovery code.
          </p>
        </div>

        <TwoFactorConfirm
          state={off}
          action={disable}
          passwordSet={passwordSet}
          submitLabel="Turn it off"
          pendingLabel="Turning it off…"
          notice={
            <FormNotice tone="info">
              This removes the factor and every recovery code with it, and signs your other devices
              out. Turning it on again means setting it up from the start.
            </FormNotice>
          }
          onCancel={() => setOpen(null)}
        />
      </div>
    );
  }

  return (
    <div className="gap-space-xs flex flex-wrap items-center">
      <button
        type="button"
        onClick={() => setOpen("codes")}
        className={`${BUTTON} border-border/60 text-foreground hover:bg-muted`}
      >
        <KeyRound className="size-4 shrink-0" aria-hidden />
        Get new recovery codes
      </button>

      <button
        type="button"
        onClick={() => setOpen("disable")}
        className={`${BUTTON} border-destructive/40 text-destructive hover:bg-destructive-subtle`}
      >
        <ShieldOff className="size-4 shrink-0" aria-hidden />
        Turn off two-factor
      </button>
    </div>
  );
}
