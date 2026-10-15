/**
 * Turning name parts into what the screen shows. No `server-only` here, unlike
 * the rest of `users/`: the avatar and the chrome are components, and the
 * session carries only a first name while the profile carries both.
 */

/**
 * Joins the name parts the backend actually sent.
 *
 * @returns The full name, one part alone, or null when neither arrived.
 */
export function fullName(first?: string | null, last?: string | null): string | null {
  const parts = [first, last].map((part) => part?.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

/**
 * Builds the initials an avatar falls back to when there is no photo.
 *
 * @returns One or two uppercase letters, or null when there is no name. Takes
 * code points rather than characters so an emoji or an accented letter outside
 * the BMP survives instead of becoming half of itself.
 */
export function initials(first?: string | null, last?: string | null): string | null {
  const letters = [first, last]
    .map((part) => [...(part?.trim() ?? "")][0])
    .filter((letter): letter is string => Boolean(letter));

  return letters.length > 0 ? letters.join("").toLocaleUpperCase() : null;
}
