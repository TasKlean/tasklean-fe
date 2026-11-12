/**
 * The pieces a row's line is built from. A line is composed rather than written
 * as one string, so the parts that came from the data can be drawn differently
 * from our own wording around them. No `server-only`: the feed renders this in
 * the browser.
 */

/** One piece of a line, saying what it is rather than how it looks. */
export type AuditToken = {
  text: string;
  // Absent for our own copy. A name was resolved from the trail or the roster,
  // a field is one the backend recorded by its own spelling, and a value is one
  // side of a change.
  emphasis?: "name" | "field" | "value";
};

/** Writes a piece of our own copy. */
export function plainToken(text: string): AuditToken {
  return { text };
}

/** Writes a name the page resolved. */
export function nameToken(text: string): AuditToken {
  return { text, emphasis: "name" };
}

/** Writes the name of a field a change touched. */
export function fieldToken(text: string): AuditToken {
  return { text, emphasis: "field" };
}

/** Writes one side of a change. */
export function valueToken(text: string): AuditToken {
  return { text, emphasis: "value" };
}

/**
 * Flattens a line to the text it reads as.
 *
 * @returns Every piece joined, which is the string a key or a test needs, since
 * the pieces already carry the spaces between them.
 */
export function tokenText(tokens: AuditToken[]): string {
  return tokens.map((token) => token.text).join("");
}
