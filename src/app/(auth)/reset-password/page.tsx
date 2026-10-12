import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/auth/back-link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your TasKlean account.",
};

/** Renders the page the emailed reset link lands on. */
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  // Trimmed because an email client that wraps the link can pad it.
  const raw = typeof token === "string" ? token.trim() : "";

  return (
    <div className="gap-space-lg flex flex-col">
      <BackLink href="/login" label="Back to log in" />

      <header className="gap-space-xs flex flex-col">
        <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
          Set a new password
        </h1>
        <p className="text-body-lg text-muted-foreground">
          {raw
            ? "The link you followed works once, and it expires 15 minutes after it was sent."
            : "This page needs the link we emailed you, and that link is missing from the address."}
        </p>
      </header>

      {raw ? (
        <ResetPasswordForm token={raw} />
      ) : (
        <div className="gap-space-md flex flex-col">
          <p
            role="status"
            className="bg-warning-subtle text-warning-subtle-foreground text-body-md p-space-md rounded-md"
          >
            An email client that wraps long links is the usual reason. Asking for a new one takes a
            moment and the old link stops working.
          </p>

          <Link
            href="/forgot-password"
            className="text-label-lg bg-primary text-primary-foreground hover:bg-primary-strong shadow-level-1 flex min-h-13 w-full items-center justify-center rounded-full px-6 transition-colors"
          >
            Ask for a new link
          </Link>
        </div>
      )}

      <p className="text-body-md text-muted-foreground text-center">
        Remembered it after all?{" "}
        <Link
          href="/login"
          className="text-link hover:text-primary-strong font-semibold underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
