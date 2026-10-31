/**
 * The caller's own account security: passwords, connected sign-in methods and
 * deactivation. Where the backend checks a credential we just sent, its 401 is
 * about that credential and not the session, so those calls say so.
 */

import "server-only";

import { serverApi } from "@/lib/api/server/server";
import type {
  ChangePasswordRequest,
  ConnectedAccounts,
  DeactivateAccountRequest,
  SetPasswordRequest,
} from "@/lib/account/account.types";
import type { AuthResponse, GoogleAuthRequest, SignedInTokens } from "@/lib/auth/auth.types";

const CONNECTED_ACCOUNTS_PATH = "/api/account/connected-accounts";

const GOOGLE_PATH = "/api/account/connected-accounts/google";

/**
 * Narrows the pair a credential change hands back.
 *
 * Not optional to persist: the backend has already revoked every refresh token
 * the account held, ours included, so losing this one ends the session.
 *
 * @throws TypeError when a 2xx arrives without a usable pair.
 */
function rotatedTokens(response: AuthResponse | undefined): SignedInTokens {
  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new TypeError("The password changed but no new token pair came back.");
  }

  return {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    userUid: response.uid ?? "",
    name: response.name,
  };
}

/**
 * Reads which sign-in methods the account has.
 *
 * @throws SessionExpiredError when the session is gone or refused.
 * @throws ApiError for every other failure.
 */
export async function getConnectedAccounts(): Promise<ConnectedAccounts> {
  return serverApi<ConnectedAccounts>(CONNECTED_ACCOUNTS_PATH);
}

/**
 * Changes the password, keeping this browser signed in.
 *
 * @param code A current second-factor code, required while the account has a
 * factor on and ignored otherwise.
 * @returns The fresh pair for this device, which the caller must seal.
 * @throws ApiError on 401 for a wrong current password or code, and 409 when
 * the account has no password to change.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  code?: string,
): Promise<SignedInTokens> {
  const body: ChangePasswordRequest = code
    ? { currentPassword, newPassword, code }
    : { currentPassword, newPassword };
  const response = await serverApi<AuthResponse>("/api/account/change-password", {
    method: "POST",
    body,
    credentialCheck: true,
  });

  return rotatedTokens(response);
}

/**
 * Sets a first password on a Google-only account.
 *
 * @param code A current second-factor code, required while the account has a
 * factor on. It is the only credential here, since there is no password yet.
 * @returns The fresh pair for this device, which the caller must seal.
 * @throws ApiError on 401 for a refused code, and 409 when the account already
 * has a password.
 */
export async function setPassword(newPassword: string, code?: string): Promise<SignedInTokens> {
  const body: SetPasswordRequest = code ? { newPassword, code } : { newPassword };
  const response = await serverApi<AuthResponse>("/api/account/set-password", {
    method: "POST",
    body,
    credentialCheck: true,
  });

  return rotatedTokens(response);
}

/**
 * Links a Google account to this one.
 *
 * @param idToken The credential from Google Identity Services.
 * @param nonce The raw per-attempt secret whose hash the token carries.
 * @returns The updated sign-in methods.
 * @throws ApiError on 401 for a token or nonce the backend refused, and 409
 * when a Google account is linked here or elsewhere already.
 */
export async function linkGoogle(idToken: string, nonce: string): Promise<ConnectedAccounts> {
  const body: GoogleAuthRequest = { idToken, nonce };
  return serverApi<ConnectedAccounts>(GOOGLE_PATH, { method: "POST", body, credentialCheck: true });
}

/**
 * Unlinks the Google account.
 *
 * @returns The updated sign-in methods.
 * @throws ApiError on 409 when nothing is linked, or when no password is set
 * and unlinking would lock the account out.
 */
export async function unlinkGoogle(): Promise<ConnectedAccounts> {
  return serverApi<ConnectedAccounts>(GOOGLE_PATH, { method: "DELETE" });
}

/**
 * Deactivates the account and revokes every session it holds.
 *
 * @param password Required where the account has one. A Google-only account
 * sends nothing and is confirmed by the session.
 * @param code A current second-factor code, required while the account has a
 * factor on and ignored otherwise.
 * @throws ApiError on 401 for a wrong or missing password or code.
 */
export async function deactivateAccount(password?: string, code?: string): Promise<void> {
  const body: DeactivateAccountRequest = {
    ...(password ? { password } : {}),
    ...(code ? { code } : {}),
  };
  await serverApi<void>("/api/account/deactivate", {
    method: "POST",
    body,
    credentialCheck: true,
  });
}
