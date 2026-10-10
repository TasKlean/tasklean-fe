/**
 * The public home page: what TasKlean is, for someone who has never heard of it.
 */

import type { Metadata } from "next";
import { Comparison } from "@/components/marketing/comparison";
import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";

// No `title`: the root layout's `default` renders "TasKlean", where a title
// here would read "Home - TasKlean".
export const metadata: Metadata = {
  description:
    "A calm household task manager for families, couples and roommates. Share one code to get everyone in, give every task an owner, and let the repeating ones come back on their own.",
  openGraph: {
    title: "TasKlean - Clean tasks, clear minds",
    description: "Household tasks for families, couples and roommates.",
    siteName: "TasKlean",
    type: "website",
  },
};

/** Renders the public home page. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <Comparison />
      <CtaBand />
    </>
  );
}
