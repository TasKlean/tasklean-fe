/**
 * Advisory rating built on the same policy the form enforces, so the meter
 * reads as progress towards submitting. `good` is the minimum the form accepts.
 */

import { isGuessable, passwordRulesMet } from "@/lib/validation/password";

export type PasswordStrength = "weak" | "good" | "strong";

// At or above this, a password meeting every rule is strong rather than good.
// Nothing below the full policy can reach strong: the form would reject it, and
// a meter calling an unsubmittable password strong contradicts itself.
const COMFORTABLE = 12;

/**
 * Rates a password.
 *
 * @returns `strong` once every rule is met at 12 characters or more, `good`
 * when the rules are met but it is short, and `weak` while rules are
 * outstanding or the password is guessable.
 */
export function scorePassword(value: string): PasswordStrength {
  if (!value || isGuessable(value)) return "weak";

  const met = passwordRulesMet(value);
  if (met === 5) return value.length >= COMFORTABLE ? "strong" : "good";
  if (met === 4) return "good";
  return "weak";
}
