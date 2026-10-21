import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { themeAttribute } from "@/lib/preferences/theme-attribute/theme-attribute";
import { readTheme } from "@/lib/preferences/theme-cookie/theme-cookie";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    // `default` is the whole title; `template` wraps what a page sets.
    default: "TasKlean",
    template: "%s - TasKlean",
  },
  description: "Clean tasks, clear minds. Household task management for families and roommates.",
  applicationName: "TasKlean",
};

const LIGHT_CHROME = "oklch(0.99 0 0)";

const DARK_CHROME = "oklch(0.17 0.015 250)";

// What the browser chrome does when the reader has not chosen a scheme.
const SYSTEM_CHROME = [
  { media: "(prefers-color-scheme: light)", color: LIGHT_CHROME },
  { media: "(prefers-color-scheme: dark)", color: DARK_CHROME },
];

// What each saved theme paints the browser chrome, including SYSTEM's pair.
const CHROME = {
  SYSTEM: SYSTEM_CHROME,
  DARK: DARK_CHROME,
  LIGHT: LIGHT_CHROME,
} as const;

// latin-ext is required for Slovenian diacritics.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

/**
 * Builds the viewport per request, because the browser chrome has to follow the
 * chosen theme too: the media-query pair would paint a light status bar above a
 * dark page on a device whose OS disagrees with the choice.
 */
export async function generateViewport(): Promise<Viewport> {
  const theme = await readTheme();

  return {
    // No maximumScale or userScalable: pinch-zoom must stay available.
    width: "device-width",
    initialScale: 1,
    themeColor: CHROME[theme],
  };
}

/**
 * The root layout: sets the document language and the chosen colour scheme,
 * applies the font variable and renders every page. Owns the title template
 * that all page titles flow through.
 *
 * `lang` stays English until the interface is translated: a `lang` the copy
 * does not match tells a screen reader to pronounce it in the wrong language.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await readTheme();

  return (
    <html lang="en" data-theme={themeAttribute(theme)} className={plusJakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
