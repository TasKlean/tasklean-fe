import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/auth/back-link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Ask for a link to set a new password.",
};

/** Renders the page that starts a password reset. */
export default function ForgotPasswordPage() {
  return (
    <div className="gap-space-lg flex flex-col">
      <BackLink href="/login" label="Back to log in" />

      <header className="gap-space-xs flex flex-col">
        <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
          Reset your password
        </h1>
        <p className="text-body-lg text-muted-foreground">
          Enter the address you signed up with and we will email you a link to set a new password.
        </p>
      </header>

      <ForgotPasswordForm />

      <p className="text-body-md text-muted-foreground text-center">
        Signing in with Google? There is no password to reset, so use the Google button on the{" "}
        <Link
          href="/login"
          className="text-link hover:text-primary-strong font-semibold underline-offset-4 hover:underline"
        >
          log in
        </Link>{" "}
        screen.
      </p>
    </div>
  );
}
