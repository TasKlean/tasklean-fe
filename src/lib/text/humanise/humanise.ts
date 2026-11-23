/**
 * Wording a name the code has no words for. The backend's enums and field names
 * reach us as constants, and one it has grown since we mapped it should still
 * read as something rather than as a blank or as `IN_PROGRESS`.
 */

// A backend constant: upper case, digits and underscores, nothing else.
const ENUM_VALUE = /^[A-Z][A-Z\d]*(?:_[A-Z\d]+)*$/;

/**
 * Turns a camelCase or UPPER_SNAKE name into a sentence-cased phrase.
 *
 * @returns The words with only the first capitalised, so a name nothing has a
 * word for is still readable rather than printed as the backend spells it.
 */
export function humanise(value: string): string {
  const words = value
    .replace(/_+/g, " ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Words a value only where it looks like one of the backend's constants.
 *
 * @returns The value humanised where it is one, and untouched otherwise, which
 * leaves a colour, an icon token or a number exactly as it was recorded.
 */
export function humanisedConstant(value: string): string {
  return ENUM_VALUE.test(value) ? humanise(value) : value;
}
