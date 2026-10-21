/**
 * The deactivation control. Two steps on purpose: the confirm asks for the
 * password, which is also what the backend re-authenticates with, and an
 * account that only has Google is confirmed by the session instead.
 */

"use client";

import { useActionState, useState } from "react";
import { Loader2, UserX } from "lucide-react";
import {
  type DeactivateState,
  deactivateAccountAction,
} from "@/app/(app)/app/settings/deactivate/actions/actions";
import { PasswordField } from "@/components/common/password-field";

type DeactivateAccountProps = {
  // With a password set the backend requires it, so the form asks for it.
  passwordSet: boolean;
};

const INITIAL: DeactivateState = { error: null };

const BUTTON =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** Renders the deactivation control and its confirmation. */
export function DeactivateAccount({ passwordSet }: Readonly<DeactivateAccountProps>) {
  const [state, deactivate, pending] = useActionState(deactivateAccountAction, INITIAL);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");

  const ready = !passwordSet || password !== "";

  return (
    <div className="gap-space-sm flex flex-col">
      {confirming ? (
        <form action={deactivate} className="gap-space-md flex flex-col" noValidate>
          <p className="text-body-md text-muted-foreground">
            Your account is closed and every session ends. Your groups keep what you shared with
            them. Write to us if you want it back.
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
