/**
 * What a name in a row's line narrows the feed to, and where pressing it goes.
 * The trail's own rows are the shortest way into its filter: the name a reader
 * wants is already on screen, where a dropdown asks them to find it again.
 *
 * No `server-only`: the feed paints these in the browser.
 */

import { filterHref, filterTypeFor } from "@/lib/audit/filter/filter";
import type { AuditFilter, AuditFilterType } from "@/lib/audit/filter/filter.types";

/** What one piece of a line names, which is one axis of the filter. */
export type AuditPin =
  // A **user** uid, which is the namespace `?actor=` takes.
  | { actor: string }
  // The kind and the identifier `?type=` and `?ref=` take together, which for a
  // member is their membership uid rather than the user uid above.
  | { type: AuditFilterType; ref: string };

/** Where a feed's names lead, as the page that drew them knows it. */
export type AuditPinScope = {
  // The feed's own path, without a query of its own.
  path: string;
  // The one actor this reader may narrow by, null where they may name anybody,
  // which is an admin. The endpoint refuses a member naming somebody else with
  // a 403 carrying no code and `allowedActor` clears it, so the press would
  // land on the whole trail and read as broken.
  onlyActor: string | null;
};

/** Everything the painter needs: where the names lead, and what is already on. */
export type AuditPinning = AuditPinScope & { filter: AuditFilter };

/**
 * Names the pin for whoever acted.
 *
 * @param uid The actor's own user uid, absent on an entry with no caller.
 * @returns The pin, or undefined for the system, which nobody can filter by.
 */
export function actorPin(uid: string | null | undefined): AuditPin | undefined {
  return uid ? { actor: uid } : undefined;
}

/**
 * Names the pin for the thing a row is about.
 *
 * @param type The entity type the entry carries.
 * @param ref The identifier the backend addresses it by.
 * @returns The pin, or undefined where the filter cannot ask for that kind: a
 * type a past build wrote and the backend has since dropped is one of those.
 */
export function entityPin(
  type: string | null | undefined,
  ref: string | null | undefined,
): AuditPin | undefined {
  const token = filterTypeFor(type);

  return token && ref ? { type: token, ref } : undefined;
}

/** Whether the feed is already reading exactly what this pin asks for. */
function alreadyOn(filter: AuditFilter, pin: AuditPin): boolean {
  if ("actor" in pin) return filter.actor === pin.actor;

  return filter.type === pin.type && filter.ref === pin.ref;
}

/**
 * Builds the link one name in a line leads to.
 *
 * @param pinning Where the feed's names lead, and what narrows it now, which is
 * carried over: pressing a name changes one axis and leaves the others alone,
 * exactly as the dropdowns do.
 * @param pin What the name itself stands for.
 * @returns The link, or null where pressing it would do nothing worth drawing a
 * link for: the feed is already narrowed to it, or the reader may not ask for
 * that actor at all.
 */
export function pinHref(pinning: AuditPinning, pin: AuditPin): string | null {
  const { path, filter, onlyActor } = pinning;
  if (alreadyOn(filter, pin)) return null;

  if ("actor" in pin) {
    if (onlyActor !== null && onlyActor !== pin.actor) return null;

    return filterHref(path, { ...filter, actor: pin.actor });
  }

  return filterHref(path, { ...filter, type: pin.type, ref: pin.ref });
}
