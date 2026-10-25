/**
 * The page for a URL that matches no route. It sits at the app root, which is
 * the only place Next looks for an unmatched path, so it carries its own
 * chrome: no route group's layout wraps it.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/common/brand-mark";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Renders the 404 page. */
export default function NotFound() {
  return (
    <div className="bg-background px-margin md:px-margin-tablet lg:px-margin-desktop py-space-2xl flex min-h-svh flex-col items-center justify-center">
      <div className="gap-space-xl flex w-full max-w-prose flex-col items-center text-center">
        <Link href="/" className="flex items-center">
          <BrandMark />
        </Link>

        <div className="gap-space-sm flex flex-col">
          <p className="text-label-md text-muted-foreground">Error 404</p>
          <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
            We cannot find that page
          </h1>
          <p className="text-body-lg text-muted-foreground">
            The link may be out of date, or the address may have a typo in it. Nothing is broken.
          </p>
        </div>

        <Link
          href="/app"
          className="text-label-lg bg-primary text-primary-foreground hover:bg-primary-strong px-space-xl gap-space-xs shadow-level-1 flex min-h-12 items-center justify-center rounded-full transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to app
        </Link>
      </div>
    </div>
  );
}
