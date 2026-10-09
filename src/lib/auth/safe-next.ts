/**
 * Keeps a post-login redirect inside this app, so a crafted `next` cannot turn
 * the login form into an open redirect.
 */

/** Returns `next` when it is a safe in-app path, and `/` otherwise. */
export function safeNext(next: string | undefined | null): string {
  if (!next) return "/";

  const trimmed = next.trim();

  // Each of these leaves the origin despite starting with a slash, or smuggles
  // a second URL past the check.
  if (!trimmed.startsWith("/")) return "/";
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return "/";
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return "/";

  return trimmed;
}
