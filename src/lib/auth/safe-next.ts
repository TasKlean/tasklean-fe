/**
 * Keeps a post-login redirect inside this app, so a crafted `next` cannot turn
 * the login form into an open redirect.
 */

// Where a signed-in visitor belongs when nothing else was asked for. The
// marketing page is still public, so it is not a redirect target.
export const SIGNED_IN_HOME = "/app";

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
