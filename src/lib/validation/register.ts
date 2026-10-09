/**
 * One validator for the register form, called by both the form and its action
 * so the rules cannot drift apart.
 */

import { validateEmail } from "@/lib/validation/email";
import { validatePassword } from "@/lib/validation/password";

export type RegisterFields = {
  name: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterErrors = Partial<Record<keyof RegisterFields, string>>;

const HAS_SPACE = /\s/;

/** Returns a message per invalid field, and an empty object when all are fine. */
export function validateRegister(fields: RegisterFields): RegisterErrors {
  const errors: RegisterErrors = {};

  const name = fields.name.trim();
  const lastName = fields.lastName.trim();

  if (!name) errors.name = "Enter your first name.";
  else if (HAS_SPACE.test(name)) errors.name = "Use one word, without spaces.";

  // A space is allowed here on purpose: "Van Der Berg" and "De La Cruz" are
  // ordinary surnames, where a two-word first name rarely is.
  if (!lastName) errors.lastName = "Enter your last name.";

  const email = validateEmail(fields.email);
  if (email) errors.email = email;

  const password = validatePassword(fields.password);
  if (password) errors.password = password;

  if (!fields.confirmPassword) {
    errors.confirmPassword = "Repeat your password.";
  } else if (fields.confirmPassword !== fields.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
