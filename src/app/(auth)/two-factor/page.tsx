import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/auth/back-link";
import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { readChallenge } from "@/lib/auth/two-factor-challenge";

export const metadata: Metadata = {
  title: "Two-factor code",
  description: "Enter the code from your authenticator app to finish signing in.",
};

/** Renders the second-factor prompt, or sends a visitor with nothing to answer back. */
export default async function TwoFactorPage({ searchParams }: PageProps<"/two-factor">) {
  const { next } = await searchParams;

  // Only a gated sign-in mints a challenge, so without one there is nothing
  // this screen can finish.
  if (!(await readChallenge())) redirect("/login");

  return (
    <div className="gap-space-lg flex flex-col">
      <BackLink href="/login" label="Back to sign in" />

      <header className="gap-space-xs flex flex-col">
        <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
          One more step
        </h1>
        <p className="text-body-lg text-muted-foreground">
          Open your authenticator app and enter the 6-digit code for TasKlean. Lost your phone? A
          recovery code works here too.
        </p>
      </header>

      <TwoFactorForm next={typeof next === "string" ? next : undefined} />

      <p className="text-body-md text-muted-foreground text-center">
        The code expires in 5 minutes. After that, sign in again to start over.
      </p>
    </div>
  );
}
