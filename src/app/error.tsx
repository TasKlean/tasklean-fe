/**
 * The fallback for an unhandled error anywhere below the root layout. Client by
 * necessity: a boundary needs a handler to retry with. Next replaces the
 * message in production, so the digest is the only identifier worth showing.
 */

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { BrandMark } from "@/components/common/brand-mark";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Renders the error page, offering a retry before sending the user home. */
export default function ErrorPage({ error, reset }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-background px-margin md:px-margin-tablet lg:px-margin-desktop py-space-2xl flex min-h-dvh flex-col items-center justify-center">
      <div className="gap-space-xl flex w-full max-w-prose flex-col items-center text-center">
        <Link href="/" className="flex items-center">
          <BrandMark />
        </Link>

        <div className="gap-space-sm flex flex-col">
          <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
            Something went wrong on our side
          </h1>
          <p className="text-body-lg text-muted-foreground">
            The page could not be loaded. Trying again often works, and your account is unaffected.
          </p>
        </div>

        <div className="gap-space-sm flex w-full flex-col items-center sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="text-label-lg bg-primary text-primary-foreground hover:bg-primary-strong px-space-xl gap-space-xs shadow-level-1 flex min-h-12 w-full items-center justify-center rounded-full whitespace-nowrap transition-colors sm:w-auto"
          >
            <RotateCcw className="size-4" aria-hidden />
            Try again
          </button>

          <Link
            href="/"
            className="text-label-lg text-primary-strong hover:bg-muted px-space-xl flex min-h-12 w-full items-center justify-center rounded-full whitespace-nowrap transition-colors sm:w-auto"
          >
            Back to home
          </Link>
        </div>

        {error.digest ? (
          <p className="text-label-md text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
