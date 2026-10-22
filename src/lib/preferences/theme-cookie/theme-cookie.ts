/**
 * The chosen theme, cached in a cookie so the server paints the right scheme
 * before any JavaScript runs. The API is the authority: Proxy re-reads it on
 * every document request and rewrites this cache, which is how a change made
 * on another device arrives.
 */

import "server-only";

import { cookies } from "next/headers";
import { asTheme, DEFAULT_PREFERENCES, type Theme } from "@/lib/preferences/preferences.types";

export const THEME_COOKIE_NAME = "tasklean_theme";

// 400 days, the ceiling Chrome enforces. Rewritten on every save anyway.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export const THEME_COOKIE_OPTIONS = {
  // Nothing in the browser reads it: the attribute it feeds is server-rendered.
  httpOnly: true,
  // NODE_ENV is Next's own variable, not app config, so it skips env.ts.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

/**
 * Reads the cached theme.
 *
 * @returns The saved choice, or `SYSTEM` when there is nothing usable, which
 * is also what an anonymous visitor gets.
 */
export async function readTheme(): Promise<Theme> {
  const stored = (await cookies()).get(THEME_COOKIE_NAME)?.value;
  return stored === undefined ? DEFAULT_PREFERENCES.theme : asTheme(stored);
}

/**
 * Caches the theme for the next render.
 *
 * Only callable from a Route Handler or Server Action, like every other cookie
 * write: a Server Component render cannot set cookies.
 */
export async function writeTheme(theme: Theme): Promise<void> {
  (await cookies()).set(THEME_COOKIE_NAME, theme, THEME_COOKIE_OPTIONS);
}
