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
  // Where the wordmark appears. `sm-up` drops it on a phone, which is the only
  // way the app header fits a logo, a group name and an avatar at 360px.
  wordmark?: keyof typeof WORDMARKS;
};

const SIZES = {
  sm: { px: 32, className: "size-8" },
  md: { px: 36, className: "size-9" },
};

// `sr-only` rather than `hidden`, so the link keeps its name on a phone: both
// images carry an empty alt and the wordmark is all that reads "TasKlean".
const WORDMARKS = {
  always: "",
  "sm-up": "sr-only sm:not-sr-only",
};

/** Renders the logo and wordmark as a single inline unit. */
export function BrandMark({ size = "md", wordmark = "always" }: Readonly<BrandMarkProps>) {
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
      <span className={`text-headline-sm text-primary-strong ${WORDMARKS[wordmark]}`}>
        TasKlean
      </span>
    </span>
  );
}
