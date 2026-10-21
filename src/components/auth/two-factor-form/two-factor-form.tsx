/**
 * The second-factor prompt. One field either way, posted as `code`: the six
 * boxes for an authenticator code, a plain field for a recovery code, because
 * the backend takes either and a mode of our own would only drift from it.
 */

"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import {
  type TwoFactorState,
  verifyTwoFactorAction,
} from "@/app/(auth)/two-factor/actions/actions";
import { SubmitButton } from "@/components/common/submit-button";
import { TwoFactorCodeField } from "@/components/common/two-factor-code-field/two-factor-code-field";
import { validateTwoFactor } from "@/lib/validation/forms/two-factor.schema/two-factor.schema";

type TwoFactorFormProps = {
  // Where the visitor was headed when login sent them here.
  next?: string;
};

const INITIAL: TwoFactorState = { error: null };

/** Renders the code entry and the switch between the two kinds of code. */
export function TwoFactorForm({ next }: Readonly<TwoFactorFormProps>) {
  const [state, formAction] = useActionState(verifyTwoFactorAction, INITIAL);
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const codeError = validateTwoFactor({ code }).code;

  // An empty field waits for submit; once it has content, blur is enough. The
  // server's verdict stands in whenever the shape itself is fine.
  const liveError = submitted || (touched && code !== "");
  const shownError = (liveError ? codeError : undefined) ?? state.fieldErrors?.code;

  /** Forgets what was known about the code the switch just dropped. */
  function switched() {
    setSubmitted(false);
    setTouched(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    // The action validates again, for a client running without JavaScript.
    if (codeError) event.preventDefault();
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="gap-space-md flex flex-col"
      noValidate
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="bg-destructive-subtle text-destructive-subtle-foreground text-body-md p-space-md rounded-md"
        >
          {state.error}
        </p>
      ) : null}

      <TwoFactorCodeField
        name="code"
        value={code}
        onChange={setCode}
        error={shownError}
        onBlur={() => setTouched(true)}
        onSwitch={switched}
        autoFocus
      >
        <SubmitButton pendingLabel="Checking your code…">Verify and continue</SubmitButton>
      </TwoFactorCodeField>
    </form>
  );
}
