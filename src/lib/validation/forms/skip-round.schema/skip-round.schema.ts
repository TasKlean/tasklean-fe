/**
 * What skipping a round is allowed to carry: the reason, and nothing else. No
 * minutes, because nobody spent any, and no photo even where the task demands
 * one to be marked done, since a skip asserts the work did not happen.
 *
 * Whether the round may be skipped at all is not settled here. That is the
 * task's own due date against today, which this body does not carry.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { taskNoteRule } from "@/lib/validation/rules/rules";

export const skipRoundSchema = z.object({
  note: taskNoteRule,
});

export type SkipRoundFields = z.infer<typeof skipRoundSchema>;

export type SkipRoundErrors = Partial<Record<keyof SkipRoundFields, string>>;

/** Parses the skip a press asked to record. */
export function parseSkipRound(input: unknown): Parsed<SkipRoundFields> {
  return parseWith(skipRoundSchema, input);
}

/**
 * Checks the live note of the skip form.
 *
 * @returns The one message the field can carry, which is what the form shows
 * before it is sent.
 */
export function validateSkipRound(values: { note: string }): SkipRoundErrors {
  const parsed = parseSkipRound(values);

  return parsed.ok ? {} : parsed.errors;
}
