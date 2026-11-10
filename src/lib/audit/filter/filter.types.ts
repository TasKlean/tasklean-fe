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
  // Whose actions the feed is narrowed to, empty for everybody's. A **user**
  // uid, which is a different namespace from the membership uid `ref` carries
  // for a member, and the same uid an entry's own actor is named by.
  actor: string;
  // The first day the feed reaches, as `YYYY-MM-DD` in the reader's own zone,
  // empty for no floor. A calendar day rather than an instant, so a pasted link
  // means the same days to whoever opens it.
  from: string;
  // The last day the feed reaches, inclusive here where the endpoint's own
  // parameter is exclusive. Empty for no ceiling.
  to: string;
};

// What Next hands a page as `searchParams`, which is caller-controlled: a key
// repeated in the URL arrives as a list, and anything may be missing.
export type AuditSearchParams = Record<string, string | string[] | undefined>;
