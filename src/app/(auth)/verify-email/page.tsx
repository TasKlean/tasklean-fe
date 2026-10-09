import type { Metadata } from "next";
import Link from "next/link";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Check your email",
  description: "Enter the 6-digit code we emailed to confirm your address.",
};

/** Renders the email verification page. */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { email, code } = await searchParams;

  return (
    <div className="gap-space-lg flex flex-col">
      <header className="gap-space-xs flex flex-col">
        <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
          Check your email
        </h1>
        <p className="text-body-lg text-muted-foreground">
          We sent a 6-digit code to confirm your address. It expires 5 minutes after it is sent.
        </p>
      </header>

      <VerifyEmailForm
        initialEmail={typeof email === "string" ? email : undefined}
        initialCode={typeof code === "string" ? code : undefined}
      />

      <p className="text-body-md text-muted-foreground text-center">
        Nothing arrived? Check your spam folder, or{" "}
        <Link
          href="/register"
          className="text-link hover:text-primary-strong font-semibold underline-offset-4 hover:underline"
        >
          start again
        </Link>
        .
      </p>
    </div>
  );
}
