/**
 * The password policy, mirrored from the backend. Every rule here is a hard
 * requirement: a password failing any of them cannot be submitted.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

// Not a list of symbols: a list is what leaves gaps.
export const PASSWORD_SPECIAL = /[^A-Za-z0-9]/;

export type PasswordRequirement = "length" | "uppercase" | "lowercase" | "digit" | "special";

export type PasswordRequirements = Record<PasswordRequirement, boolean>;

const COMMON = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "qwerty",
  "qwertyuiop",
  "12345678",
  "123456789",
  "1234567890",
  "letmein",
  "welcome",
  "iloveyou",
  "admin",
  "admin123",
  "football",
  "monkey",
  "dragon",
  "baseball",
  "sunshine",
  "princess",
  "superman",
  "trustno1",
  "whatever",
  "starwars",
]);

const LEET: Record<string, string> = {
  "@": "a",
  "4": "a",
  "3": "e",
  "1": "l",
  "0": "o",
  "5": "s",
  $: "s",
  "7": "t",
  "!": "i",
};

/** Undoes common character substitutions, so `P@ssw0rd` reads as `password`. */
function deleet(value: string): string {
  return value.replace(/[@43105$7!]/g, (char) => LEET[char] ?? char);
}

/** Strips a trailing digit-and-symbol tail, which is how most rules get met. */
function stem(value: string): string {
  return value.replace(/[\d\W_]+$/, "");
}

/** Reports whether every character is the same. */
function isRepeated(value: string): boolean {
  return value.length > 0 && new Set(value).size === 1;
}

/** Reports whether the characters run consecutively up or down the code points. */
function isSequential(value: string): boolean {
  if (value.length < 4) return false;
  const step = value.charCodeAt(1) - value.charCodeAt(0);
  if (step !== 1 && step !== -1) return false;
  for (let i = 2; i < value.length; i += 1) {
    if (value.charCodeAt(i) - value.charCodeAt(i - 1) !== step) return false;
  }
  return true;
}

/**
 * Reports whether a password is one of the obvious ones.
 *
 * Needed because the character rules do not catch them: `Password1!` satisfies
 * every rule and sits near the top of every breach list. This is a short list,
 * not a cracked-password corpus.
 */
export function isGuessable(value: string): boolean {
  const lower = value.toLowerCase();
  const candidates = [lower, deleet(lower), stem(lower), deleet(stem(lower))];
  if (candidates.some((candidate) => COMMON.has(candidate))) return true;
  return isRepeated(value) || isSequential(value);
}

/** Reports which rules a password currently satisfies. */
export function passwordRequirements(value: string): PasswordRequirements {
  return {
    length: value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    digit: /\d/.test(value),
    special: PASSWORD_SPECIAL.test(value),
  };
}

/** Counts satisfied rules, out of five. */
export function passwordRulesMet(value: string): number {
  return Object.values(passwordRequirements(value)).filter(Boolean).length;
}
