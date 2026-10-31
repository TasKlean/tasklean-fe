/** How one entry in a group's nav reads, which is its only branching. */

/**
 * Picks how an entry reads.
 *
 * @param open Whether this is the section on screen, which outranks its tone.
 * @param dead Whether it can be pressed at all, which outranks being
 * destructive: a control nobody can reach has no business wearing red.
 */
export function itemTone(open: boolean, dead: boolean, destructive: boolean): string {
  if (open) return "bg-muted text-foreground";
  if (dead) return "text-muted-foreground/70 disabled:cursor-not-allowed";
  if (destructive) return "text-destructive-subtle-foreground hover:bg-destructive-subtle";

  return "text-muted-foreground hover:bg-muted hover:text-foreground";
}
