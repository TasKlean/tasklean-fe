/**
 * The ranges a trail offers and the words they read by. The presets are
 * calendar days worked out from one instant and one zone, both passed in, so
 * the server's render and the browser's hydration cannot disagree about what
 * today is.
 */

import { dayKey, shiftDays } from "@/lib/time/day/day";

// One range the dropdown offers, as the two calendar days the URL carries.
// Both empty is the whole trail.
export type DateChoice = {
  label: string;
  from: string;
  to: string;
};

export const ANY_TIME = "Any time";

/** Names one day without a zone, because a calendar day has none. */
function dayName(key: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${key}T00:00:00Z`));
}

/**
 * Builds the ranges the dropdown offers.
 *
 * @param now What counts as today, passed so a test can fix the clock.
 * @param timeZone The reader's own zone, which decides which day that is.
 * @returns The whole trail first, then the windows ending today, each as the
 * pair of days the URL will carry.
 */
export function dateChoices(now: Date, timeZone: string): DateChoice[] {
  const today = dayKey(now, timeZone);

  return [
    { label: ANY_TIME, from: "", to: "" },
    { label: "Today", from: today, to: today },
    { label: "Last 7 days", from: shiftDays(today, -6), to: today },
    { label: "Last 30 days", from: shiftDays(today, -29), to: today },
    { label: "This month", from: `${today.slice(0, 7)}-01`, to: today },
  ];
}

/**
 * Reads the range a feed is showing.
 *
 * @param choices The presets, so one the reader picked keeps its own name
 * rather than being spelled back at them as two dates.
 * @returns The preset's label, the range spelled out, or "Any time".
 */
export function rangeLabel(from: string, to: string, choices: readonly DateChoice[]): string {
  if (!from && !to) return ANY_TIME;

  const preset = choices.find((choice) => choice.from === from && choice.to === to);
  if (preset) return preset.label;

  if (from && to) return from === to ? dayName(from) : `${dayName(from)} to ${dayName(to)}`;

  return from ? `Since ${dayName(from)}` : `Until ${dayName(to)}`;
}
