/**
 * Keeps a post-login redirect inside this app, so a crafted `next` cannot turn
 * the login form into an open redirect.
 */

// Where a signed-in visitor belongs when nothing else was asked for. The
// marketing page is still public, so it is not a redirect target.
export const SIGNED_IN_HOME = "/app";

// The second-factor screen a gated sign-in goes to. Here so login, Google and
// Proxy cannot disagree about the path.
export const TWO_FACTOR_PROMPT = "/two-factor";

/** Returns `next` when it is a safe in-app path, and the app's home otherwise. */
export function safeNext(next: string | undefined | null): string {
  if (!next) return SIGNED_IN_HOME;

  const trimmed = next.trim();

  // Each of these leaves the origin despite starting with a slash, or smuggles
  // a second URL past the check.
  if (!trimmed.startsWith("/")) return SIGNED_IN_HOME;
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return SIGNED_IN_HOME;
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return SIGNED_IN_HOME;

  return trimmed;
}

/**
 * Builds the second-factor screen's URL.
 *
 * @param next An already-checked destination, carried across the extra hop.
 */
export function twoFactorPrompt(next: string): string {
  if (next === SIGNED_IN_HOME) return TWO_FACTOR_PROMPT;
  return `${TWO_FACTOR_PROMPT}?next=${encodeURIComponent(next)}`;
}
