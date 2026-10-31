/**
 * The forgot-password form. The notice stays on this screen instead of
 * redirecting: the backend answers the same way for an address it has never
 * seen, so there is nothing to send anyone on to.
 */

"use client";

import { Mail } from "lucide-react";
import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "@/app/(auth)/forgot-password/actions/actions";
import { FormNotice } from "@/components/common/form-notice";
import { SubmitButton } from "@/components/common/submit-button";
import { TextField } from "@/components/common/text-field/text-field";
import { validateForgotPassword } from "@/lib/validation/forms/forgot-password.schema/forgot-password.schema";

const INITIAL: ForgotPasswordState = { error: null };

type ForgotPasswordFormProps = {
  // Carried from the login screen, so the address is typed once.
  initialEmail?: string;
};

/** Renders the form that asks for a reset link. */
export function ForgotPasswordForm({ initialEmail }: Readonly<ForgotPasswordFormProps>) {
  const [state, formAction] = useActionState(forgotPasswordAction, INITIAL);
  const [email, setEmail] = useState(state.email ?? initialEmail ?? "");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError = validateForgotPassword({ email }).email;

  // An empty field is not a mistake worth flagging until submit.
  const shown = submitted || (touched && email !== "") ? emailError : state.fieldErrors?.email;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    // Five requests an hour per IP, so a format mistake must not spend one.
    if (emailError) event.preventDefault();
  }

  return (
    <div className="gap-space-md flex flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {state.notice && !state.error ? <FormNotice tone="success">{state.notice}</FormNotice> : null}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="gap-space-md flex flex-col"
        noValidate
      >
        <TextField
          label="Email address"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail className="size-5" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched(true)}
          error={shown}
        />

        <SubmitButton pendingLabel="Sending the link…">Send reset link</SubmitButton>
      </form>
    </div>
  );
}
