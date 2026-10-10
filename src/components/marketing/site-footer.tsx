/**
 * The public footer. Carries no Privacy or Terms links on purpose — those pages
 * do not exist yet, and a dead legal link is worse than a missing one.
 */

import Link from "next/link";

import { BrandMark } from "@/components/common/brand-mark";

/** Renders the public site footer. */
export function SiteFooter() {
  return (
    <footer className="bg-muted border-border/60 w-full border-t">
      <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop py-space-2xl mx-auto">
        <div className="gap-space-xl grid grid-cols-1 md:grid-cols-12">
          <div className="gap-space-sm flex flex-col md:col-span-6">
            <BrandMark size="sm" />
            <p className="text-title-md text-primary-strong">Clean tasks, clear minds.</p>
            <p className="text-body-md text-muted-foreground max-w-sm">
              Household tasks for families, couples and roommates. Shared ownership instead of a
              ticket queue.
            </p>
          </div>

          <nav aria-label="Footer" className="gap-space-sm flex flex-col md:col-span-3">
            <h2 className="text-label-lg text-foreground uppercase">Explore</h2>
            <a
              href="#how-it-works"
              className="text-body-md text-muted-foreground hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-body-md text-muted-foreground hover:text-foreground"
            >
              Features
            </a>
            <a href="#why" className="text-body-md text-muted-foreground hover:text-foreground">
              Why TasKlean
            </a>
          </nav>

          <div className="gap-space-sm flex flex-col md:col-span-3">
            <h2 className="text-label-lg text-foreground uppercase">Get started</h2>
            <Link
              href="/register"
              className="text-body-md text-muted-foreground hover:text-foreground"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="text-body-md text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
          </div>
        </div>

        <p className="text-label-sm text-muted-foreground pt-space-lg">
          © {new Date().getFullYear()} TasKlean
        </p>
      </div>
    </footer>
  );
}
