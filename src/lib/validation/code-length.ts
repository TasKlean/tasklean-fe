/**
 * The verification code length. Its own module so `CodeInput` can size itself
 * without importing the rule set, and so the rule and the boxes cannot drift.
 */

export const CODE_LENGTH = 6;
