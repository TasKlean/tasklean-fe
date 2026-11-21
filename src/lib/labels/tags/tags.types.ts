/**
 * The tag wire shapes, hand-written from `docs/openapi.json`. A tag is a loose
 * label rather than a classification: a task carries up to five, any member
 * adds one and picks its colour, and only an admin renames or removes one.
 */

// Nothing is marked `required` in openapi.json, so nothing may be assumed
// present. Types only, so nothing of it reaches a bundle and `server-only`
// would refuse a reader that is perfectly safe.
export type Tag = {
  // Numeric, like a category. A task references a tag by `name` rather than by
  // this, which is the one place the two namespaces have to be kept apart.
  id?: number;
  groupUid?: string;
  name?: string;
  // A `#RRGGBB` hex code, absent when nobody picked one.
  color?: string;
  dateCreated?: string;
  dateUpdated?: string;
};

export type TagCreateRequest = {
  groupUid: string;
  name: string;
  color?: string;
};

// A full replace, and the one request the backend splits by field: any member
// may change the colour, but the same body is refused if a non-admin also
// changed the name, so a member's save reposts the name unchanged.
export type TagUpdateRequest = Omit<TagCreateRequest, "groupUid">;
