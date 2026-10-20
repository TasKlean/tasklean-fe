/**
 * Enrollment, in the order the backend imposes: re-authenticate, add the secret
 * to an app, then prove the app works. Only the last step turns anything on,
 * and only it returns the recovery codes.
 */

"use client";

import type { FormEvent, ReactNode } from "react";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, ShieldPlus, Smartphone } from "lucide-react";
import {
  enableAction,
  type EnableState,
  type SetupState,
  startSetupAction,
} from "@/app/(app)/app/settings/two-factor/actions";
import { RecoveryCodes } from "@/components/app/recovery-codes";
import { CodeInput } from "@/components/common/code-input";
import { CopyButton } from "@/components/common/copy-button";
import { FormNotice } from "@/components/common/form-notice";
import { PasswordField } from "@/components/common/password-field";
import { QrImage } from "@/components/common/qr-image";
import { SubmitButton } from "@/components/common/submit-button";
import { validateTwoFactorEnable } from "@/lib/validation/forms/two-factor-enable.schema";

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

const STEP = "gap-space-md flex flex-col";

const LEAD = "text-body-md text-muted-foreground";

const OPEN_BUTTON =
  "text-label-md gap-space-xs px-space-md bg-primary text-primary-foreground flex min-h-11 w-fit items-center rounded-full border border-transparent transition-opacity hover:opacity-90";

/** Separates a step from the method's own description above it. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="border-border/60 pt-space-md gap-space-md flex flex-col border-t">
      {children}
    </div>
  );
}

/** Renders whichever enrollment step the account is actually at. */
export function TwoFactorEnroll({
  enabled,
  passwordSet,
  pendingSetup,
  doneHref,
}: TwoFactorEnrollProps) {
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
        <FormNotice tone="success">
          Two-factor is on. Signing in asks for a code from now on, and every other device has been
          signed out.
        </FormNotice>

        {confirmed.recoveryCodes && confirmed.recoveryCodes.length > 0 ? (
          <>
            <div className="gap-space-xs flex flex-col">
              <h3 className="text-title-md text-foreground">Save your recovery codes</h3>
              <p className={LEAD}>
                Each one works once, and they are the only way in if you lose your phone. This is
                the one time they are shown.
              </p>
            </div>

            <RecoveryCodes codes={confirmed.recoveryCodes} doneHref={doneHref} onDone={finish} />
          </>
        ) : (
          <p className={LEAD}>
            No recovery codes came back, so there are none to save. Reload this page to see what
            your account has.
          </p>
        )}
      </Panel>
    );
  }

  if (enrollment || resuming) {
    return (
      <Panel>
        {enrollment ? (
          <>
            <div className="gap-space-xs flex flex-col">
              <h3 className="text-title-md text-foreground">Add TasKlean to your app</h3>
              <p className={LEAD}>
                Scan this with an authenticator app, then enter the code it shows. On this phone,
                open it in the app instead.
              </p>
            </div>

            <div className="gap-space-md flex flex-col sm:flex-row sm:items-start">
              <QrImage code={enrollment.qr} label="Scan this with your authenticator app" />

              <div className="gap-space-sm flex min-w-0 flex-col">
                <p className={LEAD}>Cannot scan it? Enter this key by hand.</p>

                <p className="text-body-md text-foreground font-mono break-all">
                  {enrollment.secret}
                </p>

                <div className="gap-space-xs flex flex-wrap items-center">
                  <CopyButton value={enrollment.secret} label="Copy key" />

                  <a
                    href={enrollment.otpauthUri}
                    className="text-label-md gap-space-xs px-space-md border-border/60 text-foreground hover:bg-muted flex min-h-11 items-center rounded-full border transition-colors"
                  >
                    <Smartphone className="size-4 shrink-0" aria-hidden />
                    Open in app
                  </a>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="gap-space-xs flex flex-col">
            <h3 className="text-title-md text-foreground">Finish what you started</h3>
            <p className={LEAD}>
              You set this up before without confirming it. If TasKlean is still in your
              authenticator app, enter the code it shows. If it is not, start again for a new QR
              code.
            </p>
          </div>
        )}

        {confirmed.error ? <FormNotice tone="error">{confirmed.error}</FormNotice> : null}

        <form action={enable} onSubmit={confirm} className={STEP} noValidate>
          <CodeInput
            name="code"
            label="The code from your app"
            value={code}
            onChange={setCode}
            error={shownCodeError}
          />

          <FormNotice tone="info">
            Confirming turns two-factor on, signs your other devices out, and shows your recovery
            codes. That is the only time they are shown.
          </FormNotice>

          <SubmitButton pendingLabel="Turning it on…">Turn on two-factor</SubmitButton>
        </form>

        {/* Starting again replaces the pending secret, so the old entry in the
            app stops working. */}
        {resuming ? (
          <button
            type="button"
            onClick={() => setRestarting(true)}
            className="text-label-md gap-space-xs text-muted-foreground hover:text-foreground flex min-h-11 items-center self-start transition-colors"
          >
            <RotateCcw className="size-4 shrink-0" aria-hidden />
            Start again with a new QR code
          </button>
        ) : null}
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="gap-space-xs flex flex-col">
        <h3 className="text-title-md text-foreground">Turn on two-factor</h3>
        <p className={LEAD}>
          {passwordSet
            ? "You will need an authenticator app on your phone. Confirm your password to start."
            : "You will need an authenticator app on your phone. Nothing changes until you confirm a code from it."}
        </p>
      </div>

      {setup.error ? <FormNotice tone="error">{setup.error}</FormNotice> : null}

      <form action={startSetup} className={STEP} noValidate>
        {passwordSet ? (
          <PasswordField
            label="Your password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password to continue"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={setup.fieldErrors?.password}
          />
        ) : null}

        <SubmitButton pendingLabel="Starting…" disabled={passwordSet && password === ""}>
          Start setting up
        </SubmitButton>
      </form>
    </Panel>
  );
}
