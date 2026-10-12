import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { BackHomeLink } from "@/components/auth/back-home-link";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { RegisterForm } from "@/components/auth/register-form";
import { NONCE_HEADER_NAME } from "@/lib/auth/google-nonce";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a TasKlean account and start sharing chores with your household.",
};

/** Renders the account creation page. */
export default async function RegisterPage() {
  const nonceHash = (await headers()).get(NONCE_HEADER_NAME);

  return (
    <div className="gap-space-lg flex flex-col">
      <BackHomeLink />

      <header className="gap-space-xs flex flex-col">
        <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
          Create your account
        </h1>
        <p className="text-body-lg text-muted-foreground">
          We&apos;ll email you a 6-digit code to confirm your address.
        </p>
      </header>

      <RegisterForm />

      <GoogleSignIn intent="signup" nonceHash={nonceHash} />

      <p className="text-body-md text-muted-foreground text-center">
        Already have an account?{" "}
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
