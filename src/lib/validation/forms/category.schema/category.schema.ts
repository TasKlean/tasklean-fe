/**
 * What a category is added and saved with. One module for both, because the two
 * differ only by the id an edit carries: the fields, their wording and their
 * echo are the same form in two modes.
 *
 * `PUT /api/categories/{id}` replaces everything it is sent, so a save always
 * carries the colour and the icon the category already holds, even though the
 * reader may have changed neither.
 */

import * as z from "zod/mini";
import { parseWith, type Parsed } from "@/lib/validation/parse/parse";
import {
  colorRule,
  labelIdRule,
  labelNameRule,
  optionalIconRule,
  optionalTextRule,
  uidRule,
} from "@/lib/validation/rules/rules";

const DETAILS = {
  name: labelNameRule("Enter a name for the category."),
  color: colorRule,
  icon: optionalIconRule,
};

export const categoryDetailsSchema = z.object(DETAILS);

export const createCategorySchema = z.object({
  groupUid: uidRule("Pick a group."),
  ...DETAILS,
});

export const editCategorySchema = z.object({
  groupUid: uidRule("Pick a group."),
  id: labelIdRule,
  ...DETAILS,
});

// Lenient, so even a rejected submission echoes back into the fields.
export const categoryEchoSchema = z.object({
  name: optionalTextRule,
  color: optionalTextRule,
  icon: optionalTextRule,
});

export type CreateCategoryFields = z.infer<typeof createCategorySchema>;

export type EditCategoryFields = z.infer<typeof editCategorySchema>;

// What the form holds: the icon is a string there rather than absent, because a
// picker with nothing picked is an empty value, not a missing field.
export type CategoryValues = Required<Omit<CreateCategoryFields, "groupUid">>;

export type CategoryErrors = Partial<Record<keyof CategoryValues, string>>;

/** Parses the details a category was added with. */
export function parseCreateCategory(input: unknown): Parsed<CreateCategoryFields> {
  return parseWith(createCategorySchema, input);
}

/** Parses the details a category was saved with, and which one. */
export function parseEditCategory(input: unknown): Parsed<EditCategoryFields> {
  return parseWith(editCategorySchema, input);
}

/** Pulls the rejected details back out, so a submit without JS loses nothing. */
export function echoCategory(input: unknown): CategoryValues {
  const result = z.safeParse(categoryEchoSchema, input);
  const echoed = result.success ? result.data : {};

  return {
    name: echoed.name ?? "",
    color: echoed.color ?? "",
    icon: echoed.icon ?? "",
  };
}

/** Returns a message per invalid field, for live feedback in the form. */
export function validateCategory(values: CategoryValues): CategoryErrors {
  const result = parseWith(categoryDetailsSchema, values);
  return result.ok ? {} : result.errors;
}
