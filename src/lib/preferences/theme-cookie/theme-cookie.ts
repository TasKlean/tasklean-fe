/**
 * The chosen theme, cached in a cookie so the server paints the right scheme
 * before any JavaScript runs. The API is the authority; a second cookie marks
 * how recently this cache was checked against it, and Proxy re-reads once that
 * marker expires, which is how a change made on another device arrives.
 */

import "server-only";

import { cookies } from "next/headers";
import { asTheme, DEFAULT_PREFERENCES, type Theme } from "@/lib/preferences/preferences.types";

export const THEME_COOKIE_NAME = "tasklean_theme";

// Presence is the whole value: while it is here, the cached theme is trusted.
export const THEME_CHECKED_COOKIE_NAME = "tasklean_theme_checked";

// 400 days, the ceiling Chrome enforces. Rewritten on every save anyway.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

// Also the longest a change made on another device takes to reach this one.
const CHECKED_MAX_AGE_SECONDS = 60 * 5;

export const THEME_COOKIE_OPTIONS = {
  // Nothing in the browser reads it: the attribute it feeds is server-rendered.
  httpOnly: true,
  // NODE_ENV is Next's own variable, not app config, so it skips env.ts.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;

export const THEME_CHECKED_COOKIE_OPTIONS = {
  ...THEME_COOKIE_OPTIONS,
  maxAge: CHECKED_MAX_AGE_SECONDS,
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
 * Caches the theme for the next render, and marks the cache as just checked.
 *
 * Only callable from a Route Handler or Server Action, like every other cookie
 * write: a Server Component render cannot set cookies. Every caller has just
 * had the value from the API, so the marker goes with it and Proxy is spared a
 * re-read it would learn nothing from.
 */
export async function writeTheme(theme: Theme): Promise<void> {
  const store = await cookies();
  store.set(THEME_COOKIE_NAME, theme, THEME_COOKIE_OPTIONS);
  store.set(THEME_CHECKED_COOKIE_NAME, "1", THEME_CHECKED_COOKIE_OPTIONS);
}
