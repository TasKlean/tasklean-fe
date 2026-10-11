/**
 * The login screen. Forwards the `next` path Proxy set, so a bounced visitor
 * lands where they were headed.
 */

import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { LoginForm } from "@/components/auth/login-form";
import { NONCE_HEADER_NAME } from "@/lib/auth/google-nonce";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to see today's chores and keep your household in sync.",
};

/** Renders the login page. */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  const nonceHash = (await headers()).get(NONCE_HEADER_NAME);

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

      <LoginForm next={nextPath} />

      <GoogleSignIn intent="signin" nonceHash={nonceHash} next={nextPath} />

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
