/**
 * What the menu offers and the links it offers them as. Shared, because the
 * trigger names the kind that is on while the panels render the rest of them.
 */

import { FILTER_OPTIONS, auditFilterParams, subjectNoun } from "@/lib/audit/filter/filter";
import type { AuditFilter, AuditFilterType } from "@/lib/audit/filter/filter.types";

/** One thing the menu offers: a kind of entity, or the whole trail. */
export type Choice = {
  value: AuditFilterType | null;
  label: string;
};

const ALL: Choice = { value: null, label: "All activity" };

export const CHOICES: readonly Choice[] = [ALL, ...FILTER_OPTIONS];

/**
 * Names the kind a feed is narrowed to.
 *
 * @returns The choice that is on, which is the whole trail where the URL named
 * no kind or named one we do not offer.
 */
export function chosenChoice(type: AuditFilterType | null): Choice {
  return CHOICES.find((choice) => choice.value === type) ?? ALL;
}

/**
 * Builds the link that narrows a trail by a kind of thing.
 *
 * @param path The feed's own path, without a query.
 * @param filter What the URL asks for now, so the rest of it is carried over:
 * changing the kind must not quietly drop whose actions are being read.
 * @param type The kind being asked for, or null for the whole trail.
 * @param ref One entity of that kind, where the link pins the feed to it. A
 * kind offered on its own passes none, which drops any ref the URL carried:
 * a ref names one entity, a narrower thing than the kind being asked for.
 * @returns The path, with the query that reproduces the new filter.
 */
export function choiceHref(
  path: string,
  filter: AuditFilter,
  type: AuditFilterType | null,
  ref = "",
): string {
  const query = auditFilterParams({ ...filter, type, ref }).toString();

  return query ? `${path}?${query}` : path;
}

/**
 * Names the way into one kind's own list.
 *
 * @returns What the press that drills down is called, which says which kind it
 * leads to rather than that it leads anywhere.
 */
export function drillLabel(type: AuditFilterType): string {
  return `Choose one ${subjectNoun(type)}`;
}

/**
 * Names a kind in the plural, as the menu's own rows say it.
 *
 * @returns The label the kind is offered under, falling back to the singular
 * for a kind the menu does not offer.
 */
export function pluralLabel(type: AuditFilterType): string {
  return CHOICES.find((choice) => choice.value === type)?.label ?? subjectNoun(type);
}

/**
 * Names the row that takes a list's narrowing off again.
 *
 * @param type The kind the list is of.
 * @returns The whole kind, worded as the choice it is.
 */
export function allLabel(type: AuditFilterType): string {
  return `All ${pluralLabel(type).toLowerCase()}`;
}
