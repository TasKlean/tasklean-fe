/**
 * The login screen. Forwards the `next` path Proxy set, so a bounced visitor
 * lands where they were headed.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to see today's chores and keep your household in sync.",
};

/** Renders the login page. */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <div className="gap-space-lg flex flex-col">
      <header className="gap-space-xs flex flex-col">
        <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
          Welcome back to TasKlean
        </h1>
        <p className="text-body-lg text-muted-foreground">
          Sign in to see today&apos;s chores and keep your household in sync.
        </p>
      </header>

      <LoginForm next={typeof next === "string" ? next : undefined} />

      <p className="text-body-md text-muted-foreground text-center">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/register"
          className="text-link hover:text-primary-strong font-semibold underline-offset-4 hover:underline"
        >
          Sign up for free
        </Link>
      </p>
    </div>
  );
}
