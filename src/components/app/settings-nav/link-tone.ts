/** How a section reads in the rail, which is the rail's only branching. */

/**
 * Picks how a section reads in the rail.
 *
 * @param open Whether this is the section on screen, which outranks its tone.
 */
export function linkTone(open: boolean, destructive: boolean): string {
  if (open) return "bg-muted text-foreground font-semibold";
  if (destructive) return "text-destructive-subtle-foreground hover:bg-destructive-subtle";
  return "text-muted-foreground hover:bg-muted hover:text-foreground";
}
