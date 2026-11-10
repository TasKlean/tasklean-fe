/**
 * A group trail's filter in all three of its vocabularies: read out of the URL,
 * written back into it, and translated for the endpoint that answers it.
 *
 * Nothing here narrows anything. The backend does, and it refuses a ref with no
 * type as a 400 carrying no code, so that pair is kept whole in one place.
 */

import type { AuditQuery } from "@/lib/audit/audit.types";
import type { AuditEntityType } from "@/lib/audit/entity/entity";
import {
  AUDIT_FILTER_TYPES,
  type AuditFilter,
  type AuditFilterType,
  type AuditSearchParams,
} from "@/lib/audit/filter/filter.types";

// `FieldLimits.UID` on the backend, which refuses a longer ref as a 400. Not
// truncated below it, so a ref it would have accepted is never turned into a
// different one.
const REF_MAX_LENGTH = 100;

// The endpoint's own vocabulary, which the URL's is not.
const ENTITY_FOR_TYPE: Record<AuditFilterType, AuditEntityType> = {
  task: "TASK",
  member: "GROUP_MEMBER",
  category: "CATEGORY",
  tag: "TAG",
  completion: "TASK_COMPLETION",
  group: "GROUP",
};

// Plural, because a chip narrows to a kind of thing rather than to one of them.
export const FILTER_OPTIONS: readonly { value: AuditFilterType; label: string }[] = [
  { value: "task", label: "Tasks" },
  { value: "member", label: "Members" },
  { value: "category", label: "Categories" },
  { value: "tag", label: "Tags" },
  { value: "completion", label: "Completions" },
  { value: "group", label: "Group" },
];

// Singular, for the line naming the one thing a ref pins the feed to.
const SUBJECTS: Record<AuditFilterType, string> = {
  task: "task",
  member: "member",
  category: "category",
  tag: "tag",
  completion: "completion",
  group: "group",
};

/** Takes the first value of a search param that may have arrived repeated. */
function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Reads one identifier out of the URL, capped where the backend caps it. */
function refParam(value: string | string[] | undefined): string {
  return one(value).trim().slice(0, REF_MAX_LENGTH);
}

/**
 * Narrows a URL's search params into the filter the feed runs on.
 *
 * @param params What Next handed the page, where every value is caller-chosen.
 * @returns The filter. An unknown type is the whole trail, and a ref arriving
 * without a usable type is dropped with it, since the endpoint refuses that
 * pair rather than ignoring half of it.
 */
export function auditFilter(params: AuditSearchParams): AuditFilter {
  // Read on its own: an actor narrows a feed by who acted, which is a different
  // question from what the rows are about, and the endpoint takes both at once.
  const actor = refParam(params.actor);
  const type = AUDIT_FILTER_TYPES.find((known) => known === one(params.type)) ?? null;
  if (!type) return { type: null, ref: "", actor };

  return { type, ref: refParam(params.ref), actor };
}

/**
 * Drops an actor the caller is not allowed to ask for.
 *
 * @param admin Whether the reader is an admin of this group.
 * @param viewerUid The reader's own user uid, the one actor anybody may name.
 * @returns The filter, with the actor cleared for a member naming somebody
 * else. The endpoint refuses that with a 403 carrying no code, which a group
 * screen cannot tell from the group being gone, so a URL that would earn one is
 * normalised before it is sent. UX only: Spring stays the authority.
 */
export function allowedActor(
  filter: AuditFilter,
  admin: boolean,
  viewerUid: string | null | undefined,
): AuditFilter {
  if (!filter.actor || admin || filter.actor === viewerUid) return filter;

  return { ...filter, actor: "" };
}

/**
 * Writes a filter back as the search params that reproduce it.
 *
 * @returns Only what narrows the feed, so the unfiltered trail stays at the
 * bare path and a copied URL carries nothing it does not need.
 */
export function auditFilterParams(filter: AuditFilter): URLSearchParams {
  const params = new URLSearchParams();

  if (filter.type) {
    params.set("type", filter.type);
    if (filter.ref) params.set("ref", filter.ref);
  }
  if (filter.actor) params.set("actor", filter.actor);

  return params;
}

/**
 * Turns a filter into the parameters the trail endpoint takes.
 *
 * @returns Every parameter the filter asks for. A ref is never sent alone:
 * `auditFilter` cannot produce one, and this would not pass it on.
 */
export function auditFilterQuery(filter: AuditFilter): AuditQuery {
  const query: AuditQuery = {};

  if (filter.type) {
    query.entityType = ENTITY_FOR_TYPE[filter.type];
    if (filter.ref) query.entityRef = filter.ref;
  }
  if (filter.actor) query.actorRef = filter.actor;

  return query;
}

/**
 * Names the one thing a feed is pinned to, for the line above it.
 *
 * @param type The kind of thing the ref addresses.
 * @param name What it is called, where the screen could resolve it.
 * @returns The phrase after "Showing", which falls back to the kind alone
 * rather than guessing at a name the roster no longer holds.
 */
export function subjectLabel(type: AuditFilterType, name: string | null): string {
  return name ? `${name}'s history` : `one ${SUBJECTS[type]}'s history`;
}
