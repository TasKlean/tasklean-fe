/**
 * The TasKlean logo beside the wordmark. Two image files rather than one
 * recoloured by CSS: the mark's slate reads as near-black on a dark canvas, so
 * dark mode swaps in a variant drawn in the dark scheme's own brand colour.
 */

import Image from "next/image";

import logoDark from "@/assets/logo-dark.png";
import logo from "@/assets/logo.png";

type BrandMarkProps = {
  size?: keyof typeof SIZES;
};

const SIZES = {
  sm: { px: 32, className: "size-8" },
  md: { px: 36, className: "size-9" },
};

/** Renders the logo and wordmark as a single inline unit. */
export function BrandMark({ size = "md" }: BrandMarkProps) {
  const { px, className } = SIZES[size];

  return (
    <span className="gap-space-sm flex items-center">
      {/* Empty alt on both: the wordmark beside them already says "TasKlean". */}
      <Image src={logo} alt="" width={px} height={px} className={`${className} dark:hidden`} />
      <Image
        src={logoDark}
        alt=""
        width={px}
        height={px}
        className={`${className} hidden dark:block`}
      />
      <span className="text-headline-sm text-primary-strong">TasKlean</span>
    </span>
  );
}
