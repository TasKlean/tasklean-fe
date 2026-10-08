import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Self-hosted by next/font at build time: no runtime request to Google, and no
// layout shift. latin-ext is required for Slovenian diacritics (c-caron, s-caron, z-caron).
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
