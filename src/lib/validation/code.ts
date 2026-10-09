/**
 * The verification code is exactly six digits — `openapi.json` pins both
 * minLength and maxLength to 6.
 */

export const CODE_LENGTH = 6;

/** Returns the message to show, or null when the code is the right shape. */
export function validateCode(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter the 6-digit code.";
  if (!new RegExp("^[0-9]{" + CODE_LENGTH + "}$").test(trimmed)) {
    return `Enter all ${CODE_LENGTH} digits.`;
  }
  return null;
}
