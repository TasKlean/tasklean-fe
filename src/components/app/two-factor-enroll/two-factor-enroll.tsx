/**
 * Enrollment, in the order the backend imposes: re-authenticate, add the secret
 * to an app, then prove the app works. Only the last step turns anything on,
 * and only it returns the recovery codes.
 */

"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldPlus } from "lucide-react";
import {
  enableAction,
  startSetupAction,
} from "@/app/(app)/app/settings/two-factor/actions/actions";
import type {
  EnableState,
  SetupState,
} from "@/app/(app)/app/settings/two-factor/actions/actions.types";
import { Confirmed } from "@/components/app/two-factor-enroll/confirmed";
import { ConfirmStep } from "@/components/app/two-factor-enroll/confirm-step";
import { Panel } from "@/components/app/two-factor-enroll/panel";
import { Start } from "@/components/app/two-factor-enroll/start";
import { validateTwoFactorEnable } from "@/lib/validation/forms/two-factor-enable.schema/two-factor-enable.schema";

type TwoFactorEnrollProps = {
  // Whether the account already has a confirmed factor. The component renders
  // anyway, because it may be holding recovery codes from a second ago.
  enabled: boolean;
  // With a password set the backend requires it before it hands over a secret.
  passwordSet: boolean;
  // A setup that was started and never confirmed. The app may still hold it,
  // in which case a code from it finishes the job with no new QR code.
  pendingSetup: boolean;
  // Where the screen returns to once the codes are saved.
  doneHref: string;
};

const NO_SETUP: SetupState = { error: null };

const NO_ENABLE: EnableState = { error: null };

const OPEN_BUTTON =
  "text-label-md gap-space-xs px-space-md bg-primary text-primary-foreground flex min-h-11 w-fit items-center rounded-full border border-transparent transition-opacity hover:opacity-90";

/** Renders whichever enrollment step the account is actually at. */
export function TwoFactorEnroll({
  enabled,
  passwordSet,
  pendingSetup,
  doneHref,
}: Readonly<TwoFactorEnrollProps>) {
  const [setup, startSetup] = useActionState(startSetupAction, NO_SETUP);
  const [confirmed, enable] = useActionState(enableAction, NO_ENABLE);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  // Six boxes never blur as one field, so the first press starts the live
  // error, and the backend's verdict stands whenever that one is silent.
  const codeError = validateTwoFactorEnable({ code }).code;
  const shownCodeError = (submitted ? codeError : undefined) ?? confirmed.fieldErrors?.code;

  // A fresh secret outranks everything: it is on screen and nowhere else.
  const enrollment = setup.enrollment;
  const resuming = pendingSetup && !restarting && !enrollment;

  function confirm(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (codeError) event.preventDefault();
  }

  /** Clears the codes and asks the server for the state they just changed. */
  function finish() {
    setDismissed(true);
    // The card above renders from the server, so only a re-read turns it on.
    router.refresh();
  }

  // Blank rather than a step: a setup button would otherwise flash up before
  // the re-read lands and the card turns on.
  if (dismissed) return null;

  // Sealing the new session writes a cookie, which makes Next re-render this
  // page with the factor on. Unmounting here would take the codes with it.
  if (enabled && !confirmed.done) return null;

  // Closed until asked for, so the list of methods stays a list of choices
  // rather than one open form and some headings.
  if (!open && !enrollment && !confirmed.done) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={OPEN_BUTTON}>
        <ShieldPlus className="size-4 shrink-0" aria-hidden />
        {pendingSetup ? "Finish setting up" : "Set up"}
      </button>
    );
  }

  if (confirmed.done) {
    return (
      <Panel>
        <Confirmed codes={confirmed.recoveryCodes ?? []} doneHref={doneHref} onDone={finish} />
      </Panel>
    );
  }

  if (enrollment || resuming) {
    return (
      <Panel>
        <ConfirmStep
          enrollment={enrollment}
          resuming={resuming}
          error={confirmed.error}
          action={enable}
          onSubmit={confirm}
          code={code}
          onCode={setCode}
          codeError={shownCodeError}
          onRestart={() => setRestarting(true)}
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <Start
        state={setup}
        action={startSetup}
        passwordSet={passwordSet}
        password={password}
        onPassword={setPassword}
      />
    </Panel>
  );
}
