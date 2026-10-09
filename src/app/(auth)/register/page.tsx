import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a TasKlean account and start sharing chores with your household.",
};

/** Renders the account creation page. */
export default function RegisterPage() {
  return (
    <div className="gap-space-lg flex flex-col">
      <header className="gap-space-xs flex flex-col">
        <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
          Create your account
        </h1>
        <p className="text-body-lg text-muted-foreground">
          We&apos;ll email you a 6-digit code to confirm your address.
        </p>
      </header>

      <RegisterForm />

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
