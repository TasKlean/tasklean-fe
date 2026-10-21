/**
 * Runs a Zod schema and reshapes its issues into the one-message-per-field form
 * every form uses. Zod reports every failed check; a field shows only the first.
 */

import * as z from "zod/mini";

type Issue = { readonly path: readonly PropertyKey[]; readonly message: string };

export type Parsed<Values> =
  | { ok: true; values: Values }
  | { ok: false; errors: Partial<Record<keyof Values & string, string>> };

/** Keeps the first message per field, which is the only one a form shows. */
export function firstErrors<Field extends string = string>(
  issues: readonly Issue[],
): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || field in errors) continue;
    errors[field as Field] = issue.message;
  }
  return errors;
}

/** Parses input against a form schema. */
export function parseWith<Values>(schema: z.ZodMiniType<Values>, input: unknown): Parsed<Values> {
  const result = z.safeParse(schema, input);
  if (result.success) return { ok: true, values: result.data };
  return { ok: false, errors: firstErrors(result.error.issues) };
}
