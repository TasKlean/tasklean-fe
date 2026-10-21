/**
 * The `data-theme` value `<html>` carries. Its own module because both the
 * server render and the picker in the browser set the same attribute, and a
 * client component cannot import the cookie module beside it.
 */

import type { Theme } from "@/lib/preferences/preferences.types";

/**
 * Translates a saved theme into the attribute.
 *
 * @returns `"light"` or `"dark"` for an explicit choice, and `undefined` for
 * `SYSTEM`, which leaves the media query in charge.
 */
export function themeAttribute(theme: Theme): "light" | "dark" | undefined {
  if (theme === "LIGHT") return "light";
  if (theme === "DARK") return "dark";
  return undefined;
}
