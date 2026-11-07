/**
 * What a trail's URL may ask for. The tokens are the URL's own, short and
 * lowercase, so a pasted link reads as a sentence; `auditFilterQuery` maps them
 * to the endpoint's enums.
 *
 * No `server-only`: the chip row and the feed both read this in the browser.
 */

export const AUDIT_FILTER_TYPES = [
  "task",
  "member",
  "category",
  "tag",
  "completion",
  "group",
] as const;

export type AuditFilterType = (typeof AUDIT_FILTER_TYPES)[number];

export type AuditFilter = {
  // Null is the whole trail. A ref without a type cannot be sent, so reading
  // one out of the URL drops both.
  type: AuditFilterType | null;
  // The identifier the API addresses that one entity by: a uid for a task, a
  // group or a membership, the numeric id for a category, tag or completion.
  ref: string;
};

// What Next hands a page as `searchParams`, which is caller-controlled: a key
// repeated in the URL arrives as a list, and anything may be missing.
export type AuditSearchParams = Record<string, string | string[] | undefined>;
