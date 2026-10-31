/** Which group the current path is about, which is the switcher's one input. */

const GROUPS_PREFIX = "/app/groups/";

// Static segments Next matches ahead of `[uid]`, so neither is a group.
const SIBLINGS = new Set(["new", "join"]);

/**
 * Reads the open group's uid out of a path.
 *
 * @returns The uid, or null on any path that is not inside a group.
 */
export function openGroupUid(pathname: string): string | null {
  if (!pathname.startsWith(GROUPS_PREFIX)) return null;

  const segment = pathname.slice(GROUPS_PREFIX.length).split("/")[0];
  if (!segment || SIBLINGS.has(segment)) return null;

  try {
    return decodeURIComponent(segment);
  } catch {
    // A malformed escape can match no uid, so it reads the same as no group.
    return null;
  }
}
