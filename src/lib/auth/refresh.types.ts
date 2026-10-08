/**
 * Types for token refresh: the backend's wire shape, and the shape we hand back
 * after renaming its fields.
 */

// The backend's AuthResponse: `token`, not `accessToken`, and no numeric id.
export type AuthResponse = {
  token: string;
  refreshToken: string;
  uid: string;
};

export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
  userUid: string;
};
