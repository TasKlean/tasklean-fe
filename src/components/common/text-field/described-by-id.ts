/** Which of the field's two message ids `aria-describedby` should point at. */

/**
 * Names the element describing the field, which is at most one of three.
 *
 * @returns The id to point `aria-describedby` at, or undefined when the field
 * says nothing beyond its label.
 */
export function describedById(
  errorId: string,
  hintId: string,
  { error, success, hint }: { error?: string; success?: string; hint?: string },
): string | undefined {
  if (error) return errorId;
  if (success || hint) return hintId;
  return undefined;
}
