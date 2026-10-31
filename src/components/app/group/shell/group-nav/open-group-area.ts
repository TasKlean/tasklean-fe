/**
 * Which of a group's areas a path is in. The rail reads it twice: once to pick
 * the band that sits where Workspace does, and once to decide whether the
 * group's card still earns its space.
 */

export type GroupArea = "tasks" | "overview" | "settings";

/**
 * Names the area a path is inside.
 *
 * @param group The group's own path, which is the tasks.
 * @param pathname The path on screen.
 */
export function openGroupArea(group: string, pathname: string): GroupArea {
  if (pathname.startsWith(`${group}/settings`)) return "settings";
  if (pathname.startsWith(`${group}/overview`)) return "overview";

  return "tasks";
}

/** Builds a group's own path, which every area hangs off. */
export function groupPath(uid: string): string {
  return `/app/groups/${uid}`;
}
