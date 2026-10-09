/**
 * The login form. Client-only because it holds the action's returned error; the
 * action runs on the server and is the only thing that touches the session.
 */

"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/(auth)/login/actions";
import { PasswordField } from "@/components/common/password-field";
import { SubmitButton } from "@/components/common/submit-button";
import { TextField } from "@/components/common/text-field";

const INITIAL: LoginState = { error: null };

type LoginFormProps = {
  // Where to go after signing in, forwarded by Proxy.
  next?: string;
};

/** Renders the email and password sign-in form. */
export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, INITIAL);

  return (
    <form action={formAction} className="gap-space-md flex flex-col" noValidate>
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
      />

      <PasswordField
        label="Password"
        name="password"
        placeholder="Enter your password"
        labelAction={
          // Inert rather than a link: the backend has no password-reset endpoint.
          <span
            aria-disabled
            title="Password reset is not available yet"
            className="text-label-md text-muted-foreground cursor-not-allowed"
          >
            Forgot password?
          </span>
        }
      />

      <SubmitButton pendingLabel="Signing you in…">Log in</SubmitButton>

      {/* Login cannot tell an unverified account from a wrong password, so the
          route to verification has to be offered rather than detected. */}
      <p className="text-body-md text-muted-foreground text-center">
        Haven&apos;t verified your email?{" "}
        <Link
          href="/verify-email"
          className="text-link hover:text-primary-strong font-semibold underline-offset-4 hover:underline"
        >
          Enter your code
        </Link>
      </p>
    </form>
  );
}
