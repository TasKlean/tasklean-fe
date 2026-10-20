/**
 * The auth endpoints' wire shapes. Field names are the backend's: `token`, not
 * `accessToken`, and `uid`, not `id`.
 */

// Nothing is marked `required` in openapi.json, and register really does omit
// the tokens: an unverified account gets none until it verifies. A gated
// sign-in omits them too, and sends `challengeToken` in their place.
export type AuthResponse = {
  token?: string;
  refreshToken?: string;
  uid?: string;
  email?: string;
  name?: string;
  message?: string;
  twoFactorRequired?: boolean;
  challengeToken?: string;
};

// What a credential exchange yields, whichever endpoint produced it. Neither
// display field is guaranteed: `name` is absent on a backend build that omits
// it, and enabling a second factor answers with the token pair alone, so
// `startSession` fills both from the profile instead.
export type SignedInTokens = {
  accessToken: string;
  refreshToken: string;
  userUid?: string;
  name?: string;
};

// What a sign-in produced. Login and Google can end in either, so reading the
// token pair without checking `kind` is what the backend's change broke.
export type SignInOutcome =
  { kind: "session"; tokens: SignedInTokens } | { kind: "challenge"; challengeToken: string };

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

export type TwoFactorVerifyRequest = {
  // The opaque token the gated login response returned, not a session token.
  challengeToken: string;
  // An authenticator code or one recovery code: the backend accepts either.
  code: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  // The raw token from the emailed link. The backend stores only its hash.
  token: string;
  newPassword: string;
};
