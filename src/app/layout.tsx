import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    // `default` is the whole title for pages that set none — the homepage relies
    // on it. `template` wraps whatever a page does set, so pages supply the bare
    // name ("Login") and never repeat the brand.
    default: "TasKlean",
    template: "%s - TasKlean",
  },
  description: "Clean tasks, clear minds. Household task management for families and roommates.",
  applicationName: "TasKlean",
};

export const viewport: Viewport = {
  // No maximumScale or userScalable: pinch-zoom must stay available.
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(0.99 0 0)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.17 0.015 250)" },
  ],
};

// Self-hosted by next/font at build time: no runtime request to Google, and no
// layout shift. latin-ext is required for Slovenian diacritics (c-caron, s-caron,
// z-caron). The variable font covers 400-700, which is every weight DESIGN.md uses.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

/**
 * The root layout: sets the document language, applies the font variable and
 * renders every page. Owns the title template that all page titles flow through.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
