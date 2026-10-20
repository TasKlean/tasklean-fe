/**
 * The second-factor prompt. One field either way, posted as `code`: the six
 * boxes for an authenticator code, a plain field for a recovery code, because
 * the backend takes either and a mode of our own would only drift from it.
 */

"use client";

import { KeyRound } from "lucide-react";
import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import { type TwoFactorState, verifyTwoFactorAction } from "@/app/(auth)/two-factor/actions";
import { CodeInput } from "@/components/common/code-input";
import { SubmitButton } from "@/components/common/submit-button";
import { TextField } from "@/components/common/text-field";
import { validateTwoFactor } from "@/lib/validation/forms/two-factor.schema";

type TwoFactorFormProps = {
  // Where the visitor was headed when login sent them here.
  next?: string;
};

const INITIAL: TwoFactorState = { error: null };

const RECOVERY_HINT = "One of the codes you saved. The hyphen and the case do not matter.";

/** Renders the code entry and the switch between the two kinds of code. */
export function TwoFactorForm({ next }: TwoFactorFormProps) {
  const [state, formAction] = useActionState(verifyTwoFactorAction, INITIAL);
  const [recovery, setRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const codeError = validateTwoFactor({ code }).code;

  // An empty field waits for submit; once it has content, blur is enough. The
  // server's verdict stands in whenever the shape itself is fine.
  const liveError = submitted || (touched && code !== "");
  const shownError = (liveError ? codeError : undefined) ?? state.fieldErrors?.code;

  /** Swaps the field, dropping a code that belongs to the other kind. */
  function switchTo(useRecovery: boolean) {
    setRecovery(useRecovery);
    setCode("");
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

      {recovery ? (
        <TextField
          label="Recovery code"
          name="code"
          required
          autoComplete="one-time-code"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="abcd-efgh"
          icon={<KeyRound className="size-5" />}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onBlur={() => setTouched(true)}
          error={shownError}
          hint={RECOVERY_HINT}
        />
      ) : (
        <CodeInput
          name="code"
          label="6-digit code"
          value={code}
          onChange={setCode}
          error={shownError}
          autoFocus
        />
      )}

      <SubmitButton pendingLabel="Checking your code…">Verify and continue</SubmitButton>

      <button
        type="button"
        onClick={() => switchTo(!recovery)}
        className="text-link hover:text-primary-strong text-body-md focus-visible:ring-ring min-h-11 self-center rounded-full px-4 font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        {recovery ? "Use your authenticator app instead" : "Use a recovery code instead"}
      </button>
    </form>
  );
}
