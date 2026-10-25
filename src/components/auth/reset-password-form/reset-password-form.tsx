/**
 * The reset-password form. Same policy and meter as register, because it sets
 * the same password; the emailed token rides along as a hidden field so the
 * action works without JavaScript.
 */

"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/app/(auth)/reset-password/actions/actions";
import { PasswordField } from "@/components/common/password-field";
import { PasswordStrengthMeter } from "@/components/common/password-strength-meter";
import { SubmitButton } from "@/components/common/submit-button";
import { PASSWORD_HINT } from "@/lib/validation/password/policy/policy";
import { validateResetPassword } from "@/lib/validation/forms/reset-password.schema/reset-password.schema";

const INITIAL: ResetPasswordState = { error: null };

type ResetPasswordFormProps = {
  // The raw token from the emailed link.
  token: string;
};

type Field = "password" | "confirmPassword";

/** Renders the form that sets a new password. */
export function ResetPasswordForm({ token }: Readonly<ResetPasswordFormProps>) {
  const [state, formAction] = useActionState(resetPasswordAction, INITIAL);
  const [fields, setFields] = useState({ password: "", confirmPassword: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validateResetPassword({ ...fields, token });
  const passwordsMatch =
    fields.confirmPassword !== "" && fields.confirmPassword === fields.password;

  function shown(field: Field): string | undefined {
    const visible = submitted || (touched[field] === true && fields[field] !== "");
    return visible ? errors[field] : state.fieldErrors?.[field];
  }

  function set(field: Field) {
    return (event: { target: { value: string } }) =>
      setFields((was) => ({ ...was, [field]: event.target.value }));
  }

  function touch(field: Field) {
    return () => setTouched((was) => ({ ...was, [field]: true }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    // The token is single use, so a rejected submit must not spend it.
    if (errors.password || errors.confirmPassword) event.preventDefault();
  }

  return (
    <div className="gap-space-md flex flex-col">
      {state.error ? (
        <p
          role="alert"
          className="bg-destructive-subtle text-destructive-subtle-foreground text-body-md p-space-md rounded-md"
        >
          {state.error}
        </p>
      ) : null}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="gap-space-md flex flex-col"
        noValidate
      >
        <input type="hidden" name="token" value={token} />

        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          placeholder="Enter a new password"
          hint={fields.password ? undefined : PASSWORD_HINT}
          below={<PasswordStrengthMeter password={fields.password} />}
          value={fields.password}
          onChange={set("password")}
          onBlur={touch("password")}
          error={shown("password")}
        />

        <PasswordField
          label="Repeat new password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat the new password"
          value={fields.confirmPassword}
          onChange={set("confirmPassword")}
          onBlur={touch("confirmPassword")}
          error={shown("confirmPassword")}
          success={passwordsMatch ? "Passwords match" : undefined}
        />

        <SubmitButton pendingLabel="Setting your password…">Set new password</SubmitButton>
      </form>
    </div>
  );
}
