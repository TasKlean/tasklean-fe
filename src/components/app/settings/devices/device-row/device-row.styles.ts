/** The classes the row's buttons share, so a destructive one differs only where it means to. */

export const BUTTON =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const QUIET_BUTTON = `${BUTTON} border-border/60 text-muted-foreground hover:bg-muted`;

export const SPINNER = "size-4 motion-safe:animate-spin";
