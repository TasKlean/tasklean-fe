/**
 * The field-level Zod pieces every form schema composes. Only the first failing
 * check on a field is ever shown, so the order here is the order a user is
 * asked to fix things.
 */

import * as z from "zod/mini";
import {
  isGuessable,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SPECIAL,
} from "@/lib/validation/password/policy";
import { CODE_LENGTH } from "@/lib/validation/code-length";

// Stricter than the backend's `@Email`, which accepts a dotless domain.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A required, trimmed address. */
export const emailRule = z
  .string({ error: "Enter your email address." })
  .check(
    z.trim(),
    z.minLength(1, "Enter your email address."),
    z.regex(EMAIL, "Enter a valid email address."),
  );

/** A required, trimmed single word — a first name. */
export const singleWordRule = (missing: string) =>
  z
    .string({ error: missing })
    .check(z.trim(), z.minLength(1, missing), z.regex(/^\S+$/, "Use one word, without spaces."));

/** Required, trimmed free text — a surname, where spaces are ordinary. */
export const requiredTextRule = (missing: string) =>
  z.string({ error: missing }).check(z.trim(), z.minLength(1, missing));

/** Optional trimmed text, absent when blank. */
export const optionalTextRule = z.optional(z.string().check(z.trim()));

/** The full password policy. Never trimmed — it must reach the backend as typed. */
export const passwordRule = z.string({ error: "Choose a password." }).check(
  z.minLength(1, "Choose a password."),
  z.minLength(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`),
  z.maxLength(PASSWORD_MAX_LENGTH, `Use no more than ${PASSWORD_MAX_LENGTH} characters.`),
  z.regex(/[A-Z]/, "Add an uppercase letter."),
  z.regex(/[a-z]/, "Add a lowercase letter."),
  z.regex(/\d/, "Add a number."),
  z.regex(PASSWORD_SPECIAL, "Add a special character."),
  z.refine((value) => !isGuessable(value), {
    error: "This password is too easy to guess. Try something less common.",
  }),
);

/** Presence only. Login must not publish the policy or lock out old passwords. */
export const anyPasswordRule = z
  .string({ error: "Enter your password." })
  .check(z.minLength(1, "Enter your password."));

/** The six-digit verification code, trimmed. */
export const codeRule = z
  .string({ error: `Enter the ${CODE_LENGTH}-digit code.` })
  .check(
    z.trim(),
    z.minLength(1, `Enter the ${CODE_LENGTH}-digit code.`),
    z.regex(new RegExp("^[0-9]{" + CODE_LENGTH + "}$"), `Enter all ${CODE_LENGTH} digits.`),
  );
