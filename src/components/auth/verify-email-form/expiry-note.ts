/** What the screen says about the code's remaining life. */

/** Formats a count of seconds as m:ss. */
function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Says what is left of the code's life.
 *
 * @param expiresIn Null when this visit did not send the code, so there is no
 * honest countdown to show.
 */
export function expiryNote(expiresIn: number | null): string {
  if (expiresIn === null) return "Codes expire 5 minutes after they are sent.";
  if (expiresIn === 0) return "That code has expired. Request a new one.";
  return `Code expires in ${clock(expiresIn)}`;
}
