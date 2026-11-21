/**
 * The category wire shapes, hand-written from `docs/openapi.json`. A category
 * is the household's filing system: a task has one, and only an admin may add,
 * rename or remove one.
 */

// Nothing is marked `required` in openapi.json, so nothing may be assumed
// present. Types only, so nothing of it reaches a bundle and `server-only`
// would refuse a reader that is perfectly safe.
export type Category = {
  // Numeric, unlike a group or a task: a category is addressed by `id`.
  id?: number;
  groupUid?: string;
  name?: string;
  // A `#RRGGBB` hex code, absent when nobody picked one: the column is
  // nullable and a create carrying no colour stores none.
  color?: string;
  // A name from the icon set the picker offers, absent the same way.
  icon?: string;
  dateCreated?: string;
  dateUpdated?: string;
};

export type CategoryCreateRequest = {
  groupUid: string;
  name: string;
  color?: string;
  icon?: string;
};

// A full replace, like the group PUT: an omitted colour or icon clears it, so
// a save that is not a removal carries what the category already holds.
export type CategoryUpdateRequest = Omit<CategoryCreateRequest, "groupUid">;
