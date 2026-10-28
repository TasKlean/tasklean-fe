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

// `code` is a current second-factor code, which the backend demands on all
// three of these only while the account has a factor turned on.
export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  code?: string;
};

export type SetPasswordRequest = {
  newPassword: string;
  code?: string;
};

export type DeactivateAccountRequest = {
  password?: string;
  code?: string;
};
