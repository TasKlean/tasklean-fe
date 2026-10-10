/**
 * The chrome every public page shares. Deliberately JS-free: the section links
 * hide below `lg`, where three of them no longer fit, rather than folding into
 * a drawer that would make this a client component. Scrolling reaches them.
 */

import Link from "next/link";

import { BrandMark } from "@/components/common/brand-mark";

const SECTIONS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#why", label: "Why TasKlean" },
];

/** Renders the public site header. */
export function SiteHeader() {
  return (
    <header className="bg-background/85 border-border/60 sticky top-0 z-50 w-full border-b backdrop-blur-xl">
      <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop gap-gutter mx-auto flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="flex items-center">
          <BrandMark />
        </Link>

        <nav aria-label="Sections" className="gap-space-lg hidden items-center lg:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="text-label-lg text-muted-foreground hover:text-foreground px-space-sm flex min-h-11 items-center whitespace-nowrap transition-colors"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="gap-space-xs flex items-center">
          <Link
            href="/login"
            className="text-label-lg text-primary-strong hover:bg-muted px-space-md flex min-h-11 items-center rounded-full whitespace-nowrap transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-label-lg bg-primary text-primary-foreground hover:bg-primary-strong px-space-md sm:px-space-lg shadow-level-1 flex min-h-11 items-center rounded-full whitespace-nowrap transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
