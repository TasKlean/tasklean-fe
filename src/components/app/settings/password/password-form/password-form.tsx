/**
 * The password card: changing the current one, or setting the first on an
 * account that has only ever signed in with Google. One component, because the
 * two differ by a single field and the backend refuses whichever does not apply.
 */

"use client";

import type { FormEvent, SetStateAction } from "react";
import { useActionState, useState } from "react";
import Link from "next/link";
import {
  changePasswordAction,
  type PasswordActionState,
  setPasswordAction,
} from "@/app/(app)/app/settings/password/actions/actions";
import { FormNotice } from "@/components/common/form-notice";
import { PasswordField } from "@/components/common/password-field";
import { PasswordStrengthMeter } from "@/components/common/password-strength-meter";
import { SubmitButton } from "@/components/common/submit-button";
import { TwoFactorCodeField } from "@/components/common/two-factor-code-field/two-factor-code-field";
import { validateChangePassword } from "@/lib/validation/forms/change-password.schema/change-password.schema";
import { validateSetPassword } from "@/lib/validation/forms/set-password.schema/set-password.schema";
import { PASSWORD_HINT } from "@/lib/validation/password/policy/policy";
import { twoFactorCodeError } from "@/lib/validation/rules/rules";

type PasswordFormProps = {
  // Picks the form: a change needs the current password, a first one does not.
  passwordSet: boolean;
  // With a factor on, the backend refuses both calls without a current code.
  twoFactorEnabled: boolean;
  // Carried into the reset link, so a forgotten password costs no retyping.
  // Null when the profile read failed, which only costs the prefill.
  email: string | null;
};

type Field = "currentPassword" | "newPassword" | "confirmPassword" | "code";

const INITIAL: PasswordActionState = { error: null };

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "", code: "" };

// What the action did, keyed by its own answer rather than by `passwordSet`,
// which the same action has already flipped by the time this is read.
const DONE_MESSAGES = {
  changed: "Your password is changed. Every other device has been signed out.",
  set: "Your password is set. You can sign in with your email address now, and every other device has been signed out.",
} as const;

/**
 * Picks the complaint a field shows.
 *
 * @returns The client's while it is visible, otherwise the backend's, which
 * stands until the field it refers to is edited.
 */
function shownError(
  clientError: string | undefined,
  serverError: string | undefined,
  visible: boolean,
  edited: boolean,
): string | undefined {
  return (visible ? clientError : undefined) ?? (edited ? undefined : serverError);
}

/** Renders the form that sets a password, and reports how it went. */
export function PasswordForm({
  passwordSet,
  twoFactorEnabled,
  email,
}: Readonly<PasswordFormProps>) {
  const [state, formAction] = useActionState(
    passwordSet ? changePasswordAction : setPasswordAction,
    INITIAL,
  );
  const [fields, setFields] = useState(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState<Partial<Record<Field, boolean>>>({});
  const [handled, setHandled] = useState(state);

  const errors: Partial<Record<Field, string>> = {
    ...(passwordSet ? validateChangePassword(fields) : validateSetPassword(fields)),
    // The schema lets the code be empty, because only the page knows whether
    // there is a factor to answer for. That makes the strict check this form's.
    ...(twoFactorEnabled ? { code: twoFactorCodeError(fields.code) } : {}),
  };

  const forgotHref = email
    ? `/forgot-password?email=${encodeURIComponent(email)}`
    : "/forgot-password";

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
    return shownError(
      errors[field],
      state.fieldErrors?.[field],
      submitted || (touched[field] === true && fields[field] !== ""),
      edited[field] === true,
    );
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

  /** Takes the code, which arrives as a value or as an updater. */
  function setCode(next: SetStateAction<string>) {
    setEdited((was) => ({ ...was, code: true }));
    setFields((was) => ({
      ...was,
      code: typeof next === "function" ? next(was.code) : next,
    }));
  }

  /** Forgets what was known about the code the switch just dropped. */
  function switched() {
    setSubmitted(false);
    setTouched((was) => ({ ...was, code: false }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) event.preventDefault();
  }

  return (
    <div className="gap-space-md flex flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {state.done ? <FormNotice tone="success">{DONE_MESSAGES[state.done]}</FormNotice> : null}

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
            labelAction={
              <Link
                href={forgotHref}
                className="text-label-md text-link hover:text-primary-strong underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            }
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

        {twoFactorEnabled ? (
          <div className="gap-space-sm flex flex-col">
            <p className="text-body-sm text-muted-foreground">
              Your account has two-factor on, so this needs a current code.
            </p>

            <TwoFactorCodeField
              name="code"
              value={fields.code}
              onChange={setCode}
              onBlur={touch("code")}
              onSwitch={switched}
              error={shown("code")}
            />
          </div>
        ) : null}

        <SubmitButton
          pendingLabel={passwordSet ? "Changing your password…" : "Setting your password…"}
        >
          {passwordSet ? "Change password" : "Set password"}
        </SubmitButton>
      </form>
    </div>
  );
}
