/**
 * The way out of an auth screen. Icon only, because the arrow sits above the
 * heading that already says where you are; the label is on the element.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Renders the back arrow to the public home page. */
export function BackHomeLink() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      // Pulled left by the circle's own padding so the arrow lines up with the
      // heading below it.
      className="text-muted-foreground hover:text-foreground hover:bg-muted -ml-3 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors"
    >
      <ArrowLeft className="size-5" aria-hidden />
    </Link>
  );
}
