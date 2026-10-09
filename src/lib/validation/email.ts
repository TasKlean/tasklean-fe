/**
 * Stricter than the backend's `@Email`, which accepts a dotless domain. A
 * missed dot is the likelier mistake here than a real intranet address.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns the message to show, or null when the address is usable. */
export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email address.";
  if (!EMAIL.test(trimmed)) return "Enter a valid email address.";
  return null;
}
