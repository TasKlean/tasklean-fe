/**
 * The shell every auth screen shares: a brand panel beside the form on wide
 * screens, the form alone on narrow ones. `robots` sits here because these
 * routes are public for access but must not be indexed.
 */

import type { Metadata } from "next";
import { Leaf, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Renders the auth chrome around a form. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="bg-background p-margin md:p-margin-tablet flex min-h-dvh flex-col items-center justify-center">
      <div className="relative w-full max-w-md lg:max-w-5xl">
        <div
          aria-hidden
          className="bg-secondary/30 pointer-events-none absolute -top-16 -left-12 size-56 rounded-full blur-3xl md:size-72"
        />
        <div
          aria-hidden
          className="bg-accent/40 pointer-events-none absolute -right-10 -bottom-16 size-56 rounded-full blur-3xl md:size-72"
        />

        <div className="bg-card shadow-level-3 relative grid grid-cols-1 overflow-hidden rounded-xl lg:grid-cols-12">
          {/* Hidden below lg: on a phone it would push the form below the fold. */}
          <aside className="bg-muted text-foreground p-margin-desktop relative hidden flex-col justify-between overflow-hidden lg:col-span-5 lg:flex">
            <div
              aria-hidden
              className="bg-secondary/20 pointer-events-none absolute -top-24 -right-24 size-96 rounded-full blur-2xl"
            />

            <div className="gap-space-sm relative z-10 flex items-center">
              <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full">
                <Leaf className="size-5" aria-hidden />
              </span>
              <span className="text-headline-sm text-primary-strong">TasKlean</span>
            </div>

            <div className="gap-space-md relative z-10 flex flex-col">
              <p className="text-label-md text-link flex items-center gap-1.5 uppercase">
                <Sparkles className="size-4" aria-hidden />
                The shared home method
              </p>
              <p className="text-headline-md text-foreground">Clean tasks, clear minds.</p>
              <p className="text-body-md text-muted-foreground">
                Household chores without the urgency of a corporate ticket queue.
              </p>
            </div>

            <p className="text-label-sm text-muted-foreground relative z-10 uppercase">
              Calm domestic flow
            </p>
          </aside>

          <div className="p-space-lg sm:p-space-xl lg:p-margin-desktop col-span-1 flex flex-col justify-center lg:col-span-7">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
