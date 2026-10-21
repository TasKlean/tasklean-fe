/**
 * One scheme's canvas. The swatch tokens are the fixed ones, so a pane shows a
 * scheme rather than wearing the active one.
 */

type PaneProps = {
  tone: "light" | "dark";
};

/** Renders one scheme's canvas, filling its parent. */
export function Pane({ tone }: Readonly<PaneProps>) {
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
