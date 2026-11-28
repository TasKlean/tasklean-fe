/**
 * The kinds of thing an audit entry can be about. The backend refuses a type it
 * does not know with a 400 rather than ignoring it, so a value that came from a
 * URL is narrowed here before it is sent. No `server-only`: a filter in the
 * browser reads these too.
 */

/** Every type the trail records, as the backend spells them. */
export const AUDIT_ENTITY_TYPES = [
  "USER",
  "TASK",
  "GROUP",
  "GROUP_MEMBER",
  "CATEGORY",
  "TAG",
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

// Account events carry no group, so a group's trail can never hold a USER row
// and a control offering one would be permanently empty.
export const GROUP_ENTITY_TYPES: readonly AuditEntityType[] = [
  "TASK",
  "GROUP",
  "GROUP_MEMBER",
  "CATEGORY",
  "TAG",
];

/**
 * Narrows a value to a type the trail records.
 *
 * @param value The candidate, typically a token out of the URL.
 * @returns The type, or null for anything the trail does not record.
 */
export function auditEntityType(value: string | null | undefined): AuditEntityType | null {
  return AUDIT_ENTITY_TYPES.find((known) => known === value) ?? null;
}

/**
 * Narrows a value to a type a group's trail can hold.
 *
 * @param value The candidate, typically a token out of the URL.
 * @returns The type, or null for anything a group's trail never carries.
 */
export function groupEntityType(value: string | null | undefined): AuditEntityType | null {
  return GROUP_ENTITY_TYPES.find((known) => known === value) ?? null;
}

/**
 * Keys one entity in the map a feed reads its names from.
 *
 * @param type The entity's own type, as the backend spells it.
 * @param ref The identifier that type is addressed by.
 * @returns The two together, because a category and a tag number themselves
 * separately: keyed by the ref alone, tag 3 would answer for category 3.
 */
export function nameKey(type: string, ref: string): string {
  return `${type}:${ref}`;
}
