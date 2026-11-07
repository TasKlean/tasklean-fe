/**
 * One chip in the row that narrows a trail. A link rather than a button, so the
 * filter stays the URL and the browser does the work.
 */

import Link from "next/link";

type FilterChipProps = {
  href: string;
  label: string;
  current: boolean;
};

const CHIP =
  "text-label-md px-space-md flex min-h-11 items-center rounded-full border transition-colors";

const QUIET = `${CHIP} border-border/60 text-muted-foreground hover:bg-muted`;

const CURRENT = `${CHIP} bg-secondary text-secondary-foreground border-transparent`;

/** Renders one kind a trail can be narrowed to. */
export function FilterChip({ href, label, current }: Readonly<FilterChipProps>) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={current ? CURRENT : QUIET}
    >
      {label}
    </Link>
  );
}
