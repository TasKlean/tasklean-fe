/**
 * Where a task has got to, in words. The backend's own constants, read by a
 * row on the board and by the open task alike, so the two cannot disagree.
 */

import { humanise } from "@/lib/text/humanise/humanise";

const STATUS: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

// Nothing is marked required in the spec, so a task may arrive with no status
// at all, which is a state to word rather than a blank to draw.
const UNKNOWN = "Not set";

/** Words where a task has got to. */
export function statusLabel(status: string | undefined): string {
  if (!status) return UNKNOWN;

  return STATUS[status] ?? humanise(status);
}
