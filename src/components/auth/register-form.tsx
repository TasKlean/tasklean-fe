/**
 * The register form. Controlled inputs, and validation on blur, for the same
 * reasons as the login form.
 */

"use client";

import { Mail, User } from "lucide-react";
import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import { registerAction, type RegisterState } from "@/app/(auth)/register/actions";
import { PasswordField } from "@/components/common/password-field";
import { PasswordStrengthMeter } from "@/components/common/password-strength-meter";
import { SubmitButton } from "@/components/common/submit-button";
import { TextField } from "@/components/common/text-field";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation/password/policy";
import { validateRegister } from "@/lib/validation/forms/register.schema";

const INITIAL: RegisterState = { error: null };

type Field = "name" | "lastName" | "email" | "password" | "confirmPassword";

/** Renders the account creation form. */
export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, INITIAL);
  const [fields, setFields] = useState({
    name: state.values?.name ?? "",
    lastName: state.values?.lastName ?? "",
    middleName: state.values?.middleName ?? "",
    email: state.values?.email ?? "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validateRegister(fields);
  const passwordsMatch =
    fields.confirmPassword !== "" && fields.confirmPassword === fields.password;

  // Leaving a field untouched-but-empty is not a mistake worth flagging, so an
  // empty field only complains once submit has been attempted.
  function shown(field: Field): string | undefined {
    const visible = submitted || (touched[field] === true && fields[field] !== "");
    return visible ? errors[field] : state.fieldErrors?.[field];
  }

  function set(field: keyof typeof fields) {
    return (event: { target: { value: string } }) =>
      setFields((was) => ({ ...was, [field]: event.target.value }));
  }

  function touch(field: Field) {
    return () => setTouched((was) => ({ ...was, [field]: true }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    // Blocking a known-bad submit matters more here than on login: register is
    // capped at five attempts an hour per IP.
    if (Object.keys(errors).length > 0) event.preventDefault();
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="gap-space-md flex flex-col"
      noValidate
    >
      {state.error ? (
        <p
          role="alert"
          className="bg-destructive-subtle text-destructive-subtle-foreground text-body-md p-space-md rounded-md"
        >
          {state.error}
        </p>
      ) : null}

      <div className="gap-space-md grid grid-cols-1 sm:grid-cols-2">
        <TextField
          label="First name"
          name="name"
          required
          autoComplete="given-name"
          placeholder="Your first name"
          icon={<User className="size-5" />}
          value={fields.name}
          onChange={set("name")}
          onBlur={touch("name")}
          error={shown("name")}
        />
        <TextField
          label="Last name"
          name="lastName"
          required
          autoComplete="family-name"
          placeholder="Your last name"
          value={fields.lastName}
          onChange={set("lastName")}
          onBlur={touch("lastName")}
          error={shown("lastName")}
        />
      </div>

      <TextField
        label="Middle name"
        name="middleName"
        autoComplete="additional-name"
        placeholder="Optional"
        value={fields.middleName}
        onChange={set("middleName")}
      />

      <TextField
        label="Email address"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        icon={<Mail className="size-5" />}
        value={fields.email}
        onChange={set("email")}
        onBlur={touch("email")}
        error={shown("email")}
      />

      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="Enter password"
        hint={
          fields.password
            ? undefined
            : `At least ${PASSWORD_MIN_LENGTH} characters, with upper and lower case, a number and a special character`
        }
        below={<PasswordStrengthMeter password={fields.password} />}
        value={fields.password}
        onChange={set("password")}
        onBlur={touch("password")}
        error={shown("password")}
      />

      <PasswordField
        label="Repeat password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Repeat password"
        value={fields.confirmPassword}
        onChange={set("confirmPassword")}
        onBlur={touch("confirmPassword")}
        error={shown("confirmPassword")}
        success={passwordsMatch ? "Passwords match" : undefined}
      />

      <SubmitButton pendingLabel="Creating your account…">Create account</SubmitButton>
    </form>
  );
}
