/**
 * The `/api/account` wire shapes: the caller's own sign-in methods and the
 * bodies that change them.
 */

// Nothing is marked `required` in openapi.json, so neither flag is assumed
// present. At least one is true for an active account, which could not sign in.
export type ConnectedAccounts = {
  passwordSet?: boolean;
  googleLinked?: boolean;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type SetPasswordRequest = {
  newPassword: string;
};

export type DeactivateAccountRequest = {
  password?: string;
};
