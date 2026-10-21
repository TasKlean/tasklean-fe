/**
 * The envelope's `code` values more than one module branches on. A code read in
 * one place stays a constant there; this is where the shared ones live, so two
 * screens cannot disagree about what the backend called the same failure.
 */

/** A password the backend re-authenticated with and refused. */
export const PASSWORD_INVALID = "PASSWORD_INVALID";
