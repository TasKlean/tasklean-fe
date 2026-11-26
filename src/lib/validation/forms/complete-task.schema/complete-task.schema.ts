/**
 * What recording a round of a task is allowed to carry. Every field is
 * optional, because the simple press posts none of them: left out, the backend
 * snapshots the task's own estimate rather than recording zero minutes.
 *
 * Whether a photo is required is not settled here. It is the task's own
 * `requiresPhotoProof`, which this body does not carry, so the screen asks for
 * one and the backend is the authority.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import { optionalUidRule, taskMinutesRule, taskNoteRule } from "@/lib/validation/rules/rules";

export const completeTaskSchema = z.object({
  minutes: taskMinutesRule,
  note: taskNoteRule,
  photoUid: optionalUidRule,
});

export type CompleteTaskFields = z.infer<typeof completeTaskSchema>;

export type CompleteTaskErrors = Partial<Record<keyof CompleteTaskFields, string>>;

// What the form holds, which is every field as the reader typed it.
export type CompleteTaskValues = {
  minutes: string;
  note: string;
};

/** Parses the round a press asked to record. */
export function parseCompleteTask(input: unknown): Parsed<CompleteTaskFields> {
  return parseWith(completeTaskSchema, input);
}

/**
 * Checks the live fields of the completion form.
 *
 * @returns One message per field that is wrong, which is what the form shows
 * before it is sent.
 */
export function validateCompleteTask(values: CompleteTaskValues): CompleteTaskErrors {
  const parsed = parseCompleteTask(values);

  return parsed.ok ? {} : parsed.errors;
}
