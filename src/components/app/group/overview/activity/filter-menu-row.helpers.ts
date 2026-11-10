/**
 * Where the divider goes in a filter menu's list. Written once because both
 * menus draw the same block and neither should decide it for itself.
 */

/**
 * Says whether a row is the first of the people who have left.
 *
 * @param rows The choices as the roster ordered them, which puts everyone still
 * in the group first.
 * @param index The row being drawn.
 * @returns True for the one row the divider belongs above, so a list that holds
 * nobody who has left draws none.
 */
export function opensFormerBlock(rows: readonly { former: boolean }[], index: number): boolean {
  return Boolean(rows[index]?.former) && !rows[index - 1]?.former;
}
