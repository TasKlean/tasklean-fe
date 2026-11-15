/**
 * The profile wire shapes, hand-written from the backend's `UserResponse` and
 * `UserRequest`. No `server-only`: the form that posts an edit runs in the
 * browser and validates against the same shape.
 */

// Nothing is marked `required` in openapi.json, so every field is optional and
// narrowed where it is used.
export type CurrentUser = {
  uid?: string;
  email?: string;
  name?: string;
  middleName?: string;
  lastName?: string;
  // Exactly one is ever set: ours is an upload uid read through `/api/image`,
  // Google's a URL. Reading only the URL draws nothing for anyone who uploaded.
  photoUid?: string;
  photoUrl?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  dateCreated?: string;
};

// A full replace, like a group's: an omitted `photoUid` clears the picture, so
// a save that is not a removal has to carry the uid the account already holds.
// No email, deliberately: changing the sign-in address is a credential change.
export type UpdateProfileRequest = {
  name: string;
  middleName?: string;
  lastName: string;
  photoUid?: string;
};
