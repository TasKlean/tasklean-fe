/**
 * The auth endpoints' wire shapes. Field names are the backend's: `token`, not
 * `accessToken`, and `uid`, not `id`.
 */

// Nothing is marked `required` in openapi.json, and register really does omit
// the tokens — an unverified account gets none until it verifies.
export type AuthResponse = {
  token?: string;
  refreshToken?: string;
  uid?: string;
  email?: string;
  name?: string;
  message?: string;
};

// What a credential exchange yields, whichever endpoint produced it. `name` is
// the display name for the chrome, absent on a backend build that omits it.
export type SignedInTokens = {
  accessToken: string;
  refreshToken: string;
  userUid: string;
  name?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  name: string;
  lastName: string;
  password: string;
  middleName?: string;
};

export type GoogleAuthRequest = {
  // The credential Google Identity Services hands the browser, not an OAuth code.
  idToken: string;
  // The raw nonce. The token carries its SHA-256, which the backend recomputes.
  nonce: string;
};

export type RefreshRequest = {
  refreshToken: string;
};
