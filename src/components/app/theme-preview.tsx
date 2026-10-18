/**
 * A miniature of a colour scheme: a heading and two lines on that scheme's own
 * canvas. System shows both, split down the middle. The swatch tokens are the
 * fixed ones, so a square shows a scheme rather than wearing the active one.
 */

import type { Theme } from "@/lib/preferences/preferences.types";

type ThemePreviewProps = {
  theme: Theme;
};

type PaneProps = {
  tone: "light" | "dark";
};

/** Renders one scheme's canvas, filling its parent. */
function Pane({ tone }: PaneProps) {
  const canvas = tone === "light" ? "bg-swatch-light" : "bg-swatch-dark";
  const ink = tone === "light" ? "bg-swatch-light-foreground" : "bg-swatch-dark-foreground";

  return (
    <span
      className={`${canvas} p-space-sm gap-space-xs absolute inset-0 flex flex-col justify-center`}
    >
      <span className={`${ink} h-1.5 w-3/5 rounded-full`} />
      <span className={`${ink} h-1 w-full rounded-full opacity-40`} />
      <span className={`${ink} h-1 w-2/3 rounded-full opacity-40`} />
    </span>
  );
}

/** Renders the square that stands for a theme. */
export function ThemePreview({ theme }: ThemePreviewProps) {
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
