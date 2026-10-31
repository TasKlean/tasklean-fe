/** The classes a settings card's buttons share, so a destructive one differs only where it means to. */

const SHAPE =
  "text-label-md gap-space-xs px-space-md flex items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const QUIET = "border-border/60 text-foreground hover:bg-muted";

export const BUTTON = `${SHAPE} min-h-11`;

export const QUIET_BUTTON = `${BUTTON} ${QUIET}`;

export const DESTRUCTIVE_BUTTON = `${BUTTON} border-destructive/40 text-destructive hover:bg-destructive-subtle`;

export const CONFIRM_BUTTON = `${BUTTON} bg-destructive-subtle text-destructive-subtle-foreground border-transparent hover:opacity-90`;

export const SPINNER = "size-4 motion-safe:animate-spin";
