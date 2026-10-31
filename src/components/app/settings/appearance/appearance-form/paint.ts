/**
 * Painting a theme from the browser. It lives beside the form because
 * `data-theme` sits on <html>, above this route, where a Server Action's
 * re-render cannot reach it.
 */

import { themeAttribute } from "@/lib/preferences/theme-attribute/theme-attribute";
import type { Theme } from "@/lib/preferences/preferences.types";

/** Paints a theme at once, the way the next server render would. */
export function paint(theme: Theme): void {
  const attribute = themeAttribute(theme);
  if (attribute) {
    document.documentElement.dataset.theme = attribute;
  } else {
    delete document.documentElement.dataset.theme;
  }
}
