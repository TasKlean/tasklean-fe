/**
 * The verification form: code boxes, expiry countdown and resend. The countdown
 * is client-side and starts on mount, because the backend never says when the
 * code was sent.
 */

"use client";

import { Mail, RotateCw } from "lucide-react";
import type { FormEvent } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { resendAction, verifyAction, type VerifyState } from "@/app/(auth)/verify-email/actions";
import { CodeInput } from "@/components/common/code-input";
import { SubmitButton } from "@/components/common/submit-button";
import { TextField } from "@/components/common/text-field";
import { validateVerifyEmail } from "@/lib/validation/forms/verify-email.schema";

const INITIAL: VerifyState = { error: null };

// The backend expires a code five minutes after sending it.
const CODE_TTL_SECONDS = 5 * 60;
// Long enough that a slow email does not tempt a second request immediately.
const RESEND_COOLDOWN_SECONDS = 45;

type VerifyEmailFormProps = {
  // Forwarded by register so the address does not have to be retyped.
  initialEmail?: string;
  // From the email link. Prefilled, never auto-submitted: mail scanners
  // prefetch links and would spend the code.
  initialCode?: string;
  // Set when login just sent a fresh code, which invalidated the earlier one.
  codeResent?: boolean;
};

/** Formats a count of seconds as m:ss. */
function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Renders the code entry, countdown and resend controls. */
export function VerifyEmailForm({ initialEmail, initialCode, codeResent }: VerifyEmailFormProps) {
  const [state, formAction] = useActionState(verifyAction, INITIAL);
  const [resendState, resendFormAction] = useActionState(resendAction, INITIAL);

  // Fixed for the component's life: the address is either given to us or typed.
  const knownEmail = Boolean(initialEmail);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState(initialCode ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // Null when this visit did not send the code, so no honest countdown exists.
  const [expiresIn, setExpiresIn] = useState<number | null>(initialCode ? null : CODE_TTL_SECONDS);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const errors = validateVerifyEmail({ email, code });
  const emailError = errors.email;
  const codeError = errors.code;

  const showEmailError = submitted || (emailTouched && email !== "");
  const expired = expiresIn === 0;

  // One interval drives both counters, so they cannot drift apart.
  useEffect(() => {
    const id = setInterval(() => {
      setExpiresIn((left) => (left === null ? null : Math.max(0, left - 1)));
      setCooldown((left) => (left > 0 ? left - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // A single-use secret has no business lingering in history or in a Referer.
  useEffect(() => {
    if (!initialCode) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("code")) return;
    url.searchParams.delete("code");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [initialCode]);

  // A fresh code restarts both clocks; the notice only appears after one is sent.
  const lastNotice = useRef<string | null>(null);
  useEffect(() => {
    if (resendState.notice && resendState.notice !== lastNotice.current) {
      lastNotice.current = resendState.notice;
      setExpiresIn(CODE_TTL_SECONDS);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }, [resendState.notice]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (emailError || codeError) event.preventDefault();
  }

  const banner = state.error ?? resendState.error;
  const notice =
    resendState.notice ??
    (codeResent ? "We sent you a new code. Any earlier code no longer works." : null);

  return (
    <div className="gap-space-md flex flex-col">
      {banner ? (
        <p
          role="alert"
          className="bg-destructive-subtle text-destructive-subtle-foreground text-body-md p-space-md rounded-md"
        >
          {banner}
        </p>
      ) : null}

      {notice && !banner ? (
        <p
          role="status"
          className="bg-success-subtle text-success-subtle-foreground text-body-md p-space-md rounded-md"
        >
          {notice}
        </p>
      ) : null}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="gap-space-md flex flex-col"
        noValidate
      >
        {knownEmail ? (
          <div className="bg-muted p-space-md flex items-center gap-3 rounded-md">
            <Mail className="text-muted-foreground size-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-label-md text-muted-foreground">Sent to</p>
              <p className="text-body-md text-foreground truncate font-semibold">{email}</p>
            </div>
            <input type="hidden" name="email" value={email} />
          </div>
        ) : (
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
            onBlur={() => setEmailTouched(true)}
            error={showEmailError ? emailError : state.fieldErrors?.email}
          />
        )}

        <CodeInput
          name="code"
          label="6-digit code"
          value={code}
          onChange={setCode}
          error={submitted ? codeError : state.fieldErrors?.code}
        />

        <p
          aria-live="polite"
          className={`text-label-md text-center ${expired ? "text-destructive" : "text-muted-foreground"}`}
        >
          {expiresIn === null
            ? "Codes expire 5 minutes after they are sent."
            : expired
              ? "That code has expired — request a new one."
              : `Code expires in ${clock(expiresIn)}`}
        </p>

        <SubmitButton pendingLabel="Checking your code…">Verify and continue</SubmitButton>
      </form>

      <form action={resendFormAction} className="text-center">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={cooldown > 0 || Boolean(emailError)}
          className="text-link hover:text-primary-strong text-body-md focus-visible:ring-ring inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
        >
          <RotateCw className="size-4" aria-hidden />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Send a new code"}
        </button>
      </form>
    </div>
  );
}
