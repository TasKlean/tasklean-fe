/**
 * The login screen. Forwards the `next` path Proxy set, so a bounced visitor
 * lands where they were headed.
 */

import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { BackLink } from "@/components/auth/back-link";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { LoginForm } from "@/components/auth/login-form/login-form";
import { FormNotice } from "@/components/common/form-notice";
import { NONCE_HEADER_NAME } from "@/lib/auth/google-nonce/google-nonce";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to see today's chores and keep your household in sync.",
};

// Keyed by the `signedOut` an action redirected with, so each way out says
// which one it was.
const SIGNED_OUT_NOTICES: Record<string, string> = {
  all: "You are signed out everywhere. Sign in again to carry on here.",
  device: "You signed this device out. Sign in again to carry on here.",
  devices: "Every device is removed. Sign in again to carry on here.",
};

/** Renders the login page. */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { deactivated, expired, next, reset, signedOut } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  const nonceHash = (await headers()).get(NONCE_HEADER_NAME);
  const signedOutNotice = typeof signedOut === "string" ? SIGNED_OUT_NOTICES[signedOut] : undefined;

  return (
    <div className="gap-space-lg flex flex-col">
      <BackLink />

      <header className="gap-space-xs flex flex-col">
        <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
          Welcome back to TasKlean
        </h1>
        <p className="text-body-lg text-muted-foreground">
          Sign in to see today&apos;s chores and keep your household in sync.
        </p>
      </header>

      {reset === "1" ? (
        <FormNotice tone="success">
          Your password is set. Sign in with it, on this device and any other.
        </FormNotice>
      ) : null}

      {/* `info`, never the muted grey these wore: `bg-muted` is what every
          input on the screen is painted in, so a notice in it read as a field. */}
      {expired === "2fa" ? (
        <FormNotice tone="info">
          That verification expired or ran out of tries. Sign in again for a new one.
        </FormNotice>
      ) : null}

      {deactivated === "1" ? (
        <FormNotice tone="info">
          Your account is deactivated. Write to us if you ever want it back.
        </FormNotice>
      ) : null}

      {signedOutNotice ? <FormNotice tone="success">{signedOutNotice}</FormNotice> : null}

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
