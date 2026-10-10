/**
 * The closing call to action.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Renders the closing call-to-action band. */
export function CtaBand() {
  return (
    <section className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop pb-space-2xl lg:pb-space-3xl mx-auto w-full">
      <div className="from-primary to-primary-strong text-primary-foreground p-space-lg sm:p-space-xl gap-space-lg shadow-level-3 flex flex-col items-center rounded-xl bg-gradient-to-br text-center md:flex-row md:text-left">
        <div className="gap-space-xs flex flex-1 flex-col">
          <h2 className="text-headline-md">Start with one group and five tasks</h2>
          <p className="text-body-md text-primary-foreground/80">
            Create an account, share the code, and the first week sorts itself out.
          </p>
        </div>

        <Link
          href="/register"
          className="text-label-lg bg-card text-primary-strong hover:bg-background px-space-xl gap-space-xs inline-flex min-h-12 w-full items-center justify-center rounded-full transition-colors sm:w-auto"
        >
          Get started
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
