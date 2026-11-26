/**
 * How often a task comes back, in words. One module because the form offers
 * the schedules and the panel reads back whichever was chosen: two copies drift
 * the moment the backend grows a fourth.
 */

import { humanise } from "@/lib/text/humanise/humanise";

const LABELS: Record<string, string> = {
  DAILY: "Every day",
  WEEKLY: "Every week",
  MONTHLY: "Every month",
};

/**
 * Words one schedule.
 *
 * @returns Our wording for a schedule we have one for, and the humanised
 * constant otherwise, so one added later reads properly before it is mapped.
 */
export function recurrenceLabel(type: string): string {
  return LABELS[type] ?? humanise(type);
}
