/**
 * The deactivation control. Two steps on purpose: the confirm asks for the
 * password, which is also what the backend re-authenticates with, and an
 * account that only has Google is confirmed by the session instead.
 */

"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, UserX } from "lucide-react";
import {
  type DeactivateState,
  deactivateAccountAction,
} from "@/app/(app)/app/settings/deactivate/actions/actions";
import { PasswordField } from "@/components/common/password-field";
import { TwoFactorCodeField } from "@/components/common/two-factor-code-field/two-factor-code-field";
import { twoFactorCodeError } from "@/lib/validation/rules/rules";

type DeactivateAccountProps = {
  // With a password set the backend requires it, so the form asks for it.
  passwordSet: boolean;
  // With a factor on it requires a current code as well.
  twoFactorEnabled: boolean;
};

const INITIAL: DeactivateState = { error: null };

const BUTTON =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Renders the deactivation control and its confirmation. */
export function DeactivateAccount({
  passwordSet,
  twoFactorEnabled,
}: Readonly<DeactivateAccountProps>) {
  const [state, deactivate, pending] = useActionState(deactivateAccountAction, INITIAL);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const codeError = twoFactorEnabled ? twoFactorCodeError(code) : undefined;
  const ready = (!passwordSet || password !== "") && codeError === undefined;

  /** Drops what was known about the code the switch just emptied. */
  function switched() {
    setSubmitted(false);
  }

  // A complete code submits the form by itself, so an empty password has to be
  // stopped here: the button being disabled is not what requestSubmit checks.
  function confirm(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (!ready) event.preventDefault();
  }

  return (
    <div className="gap-space-sm flex flex-col">
      {confirming ? (
        <form
          action={deactivate}
          onSubmit={confirm}
          className="gap-space-md flex flex-col"
          noValidate
        >
          <p className="text-body-md text-destructive">
            Your account will be deactivated and every session ended. Your groups will keep the
            content you shared with them.{" "}
            <Link
              href="/support"
              className="text-link hover:text-primary-strong font-semibold underline-offset-4 hover:underline"
            >
              Contact our support
            </Link>{" "}
            to explore reactivation options.
          </p>

          {passwordSet ? (
            <PasswordField
              label="Your password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={state.fieldErrors?.password}
            />
          ) : null}

          {twoFactorEnabled ? (
            <TwoFactorCodeField
              name="code"
              value={code}
              onChange={setCode}
              onSwitch={switched}
              error={(submitted ? codeError : undefined) ?? state.fieldErrors?.code}
            />
          ) : null}

          <div className="gap-space-xs flex flex-wrap items-center">
            <button
              type="submit"
              disabled={pending || !ready}
              aria-busy={pending}
              className={`${BUTTON} bg-destructive text-destructive-foreground border-transparent hover:opacity-90`}
            >
              {pending ? (
                <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
              ) : (
                <UserX className="size-4" aria-hidden />
              )}
              {pending ? "Deactivating" : "Yes, deactivate my account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setPassword("");
                setCode("");
                setSubmitted(false);
              }}
              disabled={pending}
              className={`${BUTTON} border-border/60 text-muted-foreground hover:bg-muted`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`${BUTTON} border-destructive/60 text-destructive-subtle-foreground hover:bg-destructive-subtle w-fit`}
        >
          <UserX className="size-4" aria-hidden />
          Deactivate my account
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
