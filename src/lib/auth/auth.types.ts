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

export type LoginRequest = {
  email: string;
  password: string;
};
