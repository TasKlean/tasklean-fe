/**
 * A miniature of a colour scheme: a heading and two lines on that scheme's own
 * canvas. System shows both, split down the middle.
 */

import { Pane } from "@/components/app/settings/appearance/theme-preview/pane";
import type { Theme } from "@/lib/preferences/preferences.types";

type ThemePreviewProps = {
  theme: Theme;
};

/** Renders the square that stands for a theme. */
export function ThemePreview({ theme }: Readonly<ThemePreviewProps>) {
  return (
    <span
      aria-hidden
      className="border-border/60 relative block aspect-square w-full overflow-hidden rounded-lg border"
    >
      <Pane tone={theme === "DARK" ? "dark" : "light"} />

      {/* The dark half, clipped to the right of the split, over the light one. */}
      {theme === "SYSTEM" ? (
        <span className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
          <Pane tone="dark" />
        </span>
      ) : null}
    </span>
  );
}
