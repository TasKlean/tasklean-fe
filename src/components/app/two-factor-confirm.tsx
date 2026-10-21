/**
 * The confirmation both weakening operations ask for: the account password,
 * where there is one, and a current second-factor code. One form serves turning
 * the factor off and replacing the codes, since the backend asks the same twice.
 */

"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import type { ConfirmState } from "@/app/(app)/app/settings/two-factor/actions/actions.types";
import { FormNotice } from "@/components/common/form-notice";
import { PasswordField } from "@/components/common/password-field";
import { SubmitButton } from "@/components/common/submit-button";
import { TwoFactorCodeField } from "@/components/common/two-factor-code-field/two-factor-code-field";
import { validateTwoFactorConfirm } from "@/lib/validation/forms/two-factor-confirm.schema/two-factor-confirm.schema";

type TwoFactorConfirmProps = {
  state: ConfirmState;
  action: (formData: FormData) => void;
  // With a password set, the backend refuses the call without it.
  passwordSet: boolean;
  submitLabel: string;
  pendingLabel: string;
  // What this is about to do, said before it is done.
  notice: ReactNode;
  onCancel: () => void;
};

const CANCEL =
  "text-label-md px-space-md border-border/60 text-foreground hover:bg-muted flex min-h-11 items-center rounded-full border transition-colors";

/** Renders the two credentials and the press that spends them. */
export function TwoFactorConfirm({
  state,
  action,
  passwordSet,
  submitLabel,
  pendingLabel,
  notice,
  onCancel,
}: Readonly<TwoFactorConfirmProps>) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const codeError = validateTwoFactorConfirm({ code }).code;
  const liveError = submitted || (touched && code !== "");
  const shownCodeError = (liveError ? codeError : undefined) ?? state.fieldErrors?.code;

  // A complete code submits itself, so the password being empty has to stop the
  // form here: the backend would otherwise answer about a field left untouched.
  const incomplete = codeError !== undefined || (passwordSet && password === "");

  /** Forgets what was known about the code the switch just dropped. */
  function switched() {
    setSubmitted(false);
    setTouched(false);
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (incomplete) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={confirm} className="gap-space-md flex flex-col" noValidate>
      {notice}

      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {passwordSet ? (
        <PasswordField
          label="Your password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password to continue"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={state.fieldErrors?.password}
        />
      ) : null}

      <TwoFactorCodeField
        name="code"
        value={code}
        onChange={setCode}
        error={shownCodeError}
        onBlur={() => setTouched(true)}
        onSwitch={switched}
        digitsLabel="The code from your app"
      >
        <div className="gap-space-xs flex flex-wrap items-center">
          <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>

          <button type="button" onClick={onCancel} className={CANCEL}>
            Cancel
          </button>
        </div>
      </TwoFactorCodeField>
    </form>
  );
}
