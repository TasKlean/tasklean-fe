/**
 * The login form. The inputs are controlled so a rejected submit keeps what was
 * typed — React resets an uncontrolled form once its action returns, and a
 * password is never echoed back through server state.
 */

"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/app/(auth)/login/actions";
import { PasswordField } from "@/components/common/password-field";
import { SubmitButton } from "@/components/common/submit-button";
import { TextField } from "@/components/common/text-field";
import { validateLogin } from "@/lib/validation/forms/login.schema";

const INITIAL: LoginState = { error: null };

type LoginFormProps = {
  // Where to go after signing in, forwarded by Proxy.
  next?: string;
};

/** Renders the email and password sign-in form. */
export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, INITIAL);
  const [email, setEmail] = useState(state.email ?? "");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);

  const errors = validateLogin({ email, password });
  const emailError = errors.email;
  const passwordError = errors.password;

  // Leaving a field untouched-but-empty is not a mistake worth flagging, so an
  // empty field only complains once submit has been attempted.
  const showEmail = submitted || (touched.email && email !== "");
  const showPassword = submitted || (touched.password && password !== "");

  const shownEmailError = showEmail ? emailError : state.fieldErrors?.email;

  // Carried so someone who has already typed their address does not type it
  // again on the next screen. Untrimmed rubbish is harmless, an empty box is not.
  const carried = email.trim();
  const forgotHref = carried
    ? `/forgot-password?email=${encodeURIComponent(carried)}`
    : "/forgot-password";
  const shownPasswordError = showPassword ? passwordError : state.fieldErrors?.password;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    // Blocking here is what stops a format mistake costing a round trip; the
    // action validates again for clients without JavaScript.
    if (emailError || passwordError) event.preventDefault();
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
        onBlur={() => setTouched((was) => ({ ...was, email: true }))}
        error={shownEmailError}
      />

      <PasswordField
        label="Password"
        name="password"
        placeholder="Enter your password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        onBlur={() => setTouched((was) => ({ ...was, password: true }))}
        error={shownPasswordError}
        labelAction={
          <Link
            href={forgotHref}
            // prefetch off: the href changes on every keystroke, and each change
            // would otherwise queue another prefetch of the same page.
            prefetch={false}
            className="text-label-md text-link hover:text-primary-strong underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        }
      />

      <SubmitButton pendingLabel="Signing you in…">Log in</SubmitButton>
    </form>
  );
}
