/**
 * The password card: changing the current one, or setting the first on an
 * account that has only ever signed in with Google. One component, because the
 * two differ by a single field and the backend refuses whichever does not apply.
 */

"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import {
  changePasswordAction,
  type PasswordActionState,
  setPasswordAction,
} from "@/app/(app)/app/settings/password/actions/actions";
import { FormNotice } from "@/components/common/form-notice";
import { PasswordField } from "@/components/common/password-field";
import { PasswordStrengthMeter } from "@/components/common/password-strength-meter";
import { SubmitButton } from "@/components/common/submit-button";
import { validateChangePassword } from "@/lib/validation/forms/change-password.schema/change-password.schema";
import { validateSetPassword } from "@/lib/validation/forms/set-password.schema/set-password.schema";
import { PASSWORD_HINT } from "@/lib/validation/password/policy/policy";

type PasswordFormProps = {
  // Picks the form: a change needs the current password, a first one does not.
  passwordSet: boolean;
};

type Field = "currentPassword" | "newPassword" | "confirmPassword";

const INITIAL: PasswordActionState = { error: null };

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

/** Renders the form that sets a password, and reports how it went. */
export function PasswordForm({ passwordSet }: Readonly<PasswordFormProps>) {
  const [state, formAction] = useActionState(
    passwordSet ? changePasswordAction : setPasswordAction,
    INITIAL,
  );
  const [fields, setFields] = useState(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState<Partial<Record<Field, boolean>>>({});
  const [handled, setHandled] = useState(state);

  const errors: Partial<Record<Field, string>> = passwordSet
    ? validateChangePassword(fields)
    : validateSetPassword(fields);

  const passwordsMatch =
    fields.confirmPassword !== "" && fields.confirmPassword === fields.newPassword;

  // Adjusted in render rather than in an effect, the way React prescribes: a
  // success empties the boxes, and only once per answer the action gives.
  if (handled !== state) {
    setHandled(state);
    setEdited({});
    if (state.done) {
      setFields(EMPTY);
      setTouched({});
      setSubmitted(false);
    }
  }

  function shown(field: Field): string | undefined {
    const visible = submitted || (touched[field] === true && fields[field] !== "");
    // The backend's verdict stands until the field it refers to is edited: only
    // it can tell a wrong current password from a right one.
    const refused = edited[field] === true ? undefined : state.fieldErrors?.[field];
    return (visible ? errors[field] : undefined) ?? refused;
  }

  function set(field: Field) {
    return (event: { target: { value: string } }) => {
      setEdited((was) => ({ ...was, [field]: true }));
      setFields((was) => ({ ...was, [field]: event.target.value }));
    };
  }

  function touch(field: Field) {
    return () => setTouched((was) => ({ ...was, [field]: true }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (errors.currentPassword || errors.newPassword || errors.confirmPassword) {
      event.preventDefault();
    }
  }

  return (
    <div className="gap-space-md flex flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {state.done ? (
        <FormNotice tone="success">
          {passwordSet
            ? "Your password is changed. Every other device has been signed out."
            : "Your password is set. You can sign in with your email address now."}
        </FormNotice>
      ) : null}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="gap-space-md flex flex-col"
        noValidate
      >
        {passwordSet ? (
          <PasswordField
            label="Current password"
            name="currentPassword"
            autoComplete="current-password"
            placeholder="Enter your current password"
            value={fields.currentPassword}
            onChange={set("currentPassword")}
            onBlur={touch("currentPassword")}
            error={shown("currentPassword")}
          />
        ) : null}

        <PasswordField
          label="New password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="Enter a new password"
          hint={fields.newPassword ? undefined : PASSWORD_HINT}
          below={<PasswordStrengthMeter password={fields.newPassword} />}
          value={fields.newPassword}
          onChange={set("newPassword")}
          onBlur={touch("newPassword")}
          error={shown("newPassword")}
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

        <SubmitButton
          pendingLabel={passwordSet ? "Changing your password…" : "Setting your password…"}
        >
          {passwordSet ? "Change password" : "Set password"}
        </SubmitButton>
      </form>
    </div>
  );
}
