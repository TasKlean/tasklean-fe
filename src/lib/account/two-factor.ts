/**
 * The caller's own second factor: reading it, turning it on, turning it off and
 * replacing its recovery codes. Every write checks a credential we just sent,
 * so its 401 is that credential's verdict and not the session dying.
 */

import "server-only";

import type { AuthResponse, SignedInTokens } from "@/lib/auth/auth.types";
import type {
  RecoveryCodesResponse,
  TwoFactorConfirmRequest,
  TwoFactorEnableRequest,
  TwoFactorEnableResponse,
  TwoFactorEnabled,
  TwoFactorSetup,
  TwoFactorSetupRequest,
  TwoFactorSetupResponse,
  TwoFactorStatus,
  TwoFactorStatusResponse,
} from "@/lib/account/two-factor.types";
import { serverApi } from "@/lib/api/server";
import { deviceHeaders } from "@/lib/auth/device";
import { parseApiDateOrNull } from "@/lib/time/api-date";

const PATH = "/api/account/2fa";

/**
 * Narrows the status, defaulting every field the response left out.
 *
 * @returns A state the screen can render without a guard per field. An
 * unreadable count reads as none left rather than as a number.
 */
function asStatus(response: TwoFactorStatusResponse | undefined): TwoFactorStatus {
  const remaining = response?.recoveryCodesRemaining;

  return {
    enabled: response?.enabled === true,
    pendingSetup: response?.pendingSetup === true,
    confirmedAt: parseApiDateOrNull(response?.confirmedAt),
    recoveryCodesRemaining: typeof remaining === "number" && remaining > 0 ? remaining : 0,
  };
}

/**
 * Narrows a list of recovery codes, dropping anything that is not a string.
 *
 * @returns The codes the response really carried, which may be none.
 */
function asRecoveryCodes(codes: string[] | undefined): string[] {
  return Array.isArray(codes) ? codes.filter((code) => typeof code === "string") : [];
}

/**
 * Builds the body both weakening operations share.
 *
 * @returns The code, plus the password only when there is one: a Google-only
 * account has none, and the backend ignores the field for it.
 */
function confirmBody(code: string, password?: string): TwoFactorConfirmRequest {
  return password ? { password, code } : { code };
}

/**
 * Reads whether the caller has a second factor, and what is left of it.
 *
 * @throws SessionExpiredError when the session is gone or refused. No
 * credential travels with this call, so a 401 really is the session.
 * @throws ApiError for every other failure.
 */
export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  return asStatus(await serverApi<TwoFactorStatusResponse>(PATH));
}

/**
 * Starts enrollment, returning what an authenticator app needs.
 *
 * Nothing is enabled by this call, and running it again replaces a setup that
 * was never confirmed, so the previous secret stops working.
 *
 * @param password Required where the account has one. A Google-only account
 * sends nothing and is confirmed by the session.
 * @throws Error when a 2xx arrives without both the secret and the URI, since
 * one alone cannot be enrolled.
 * @throws ApiError on 401 for a wrong or missing password, and 409 when a
 * second factor is already on.
 */
export async function startTwoFactorSetup(password?: string): Promise<TwoFactorSetup> {
  const body: TwoFactorSetupRequest = password ? { password } : {};
  const response = await serverApi<TwoFactorSetupResponse>(`${PATH}/setup`, {
    method: "POST",
    body,
    credentialCheck: true,
  });

  if (typeof response?.secret !== "string" || typeof response?.otpauthUri !== "string") {
    throw new Error("Two-factor setup started but returned nothing to enroll.");
  }

  return { secret: response.secret, otpauthUri: response.otpauthUri };
}

/**
 * Confirms a pending setup with a code from the app, turning the factor on.
 *
 * @returns The recovery codes, shown this once only, and the fresh pair the
 * caller must seal. The backend revokes every other session here, so losing
 * the pair ends this one too.
 * @throws Error when a 2xx arrives without a usable pair.
 * @throws ApiError on 401 for a code that did not match, and 409 when there is
 * no pending setup to confirm.
 */
export async function enableTwoFactor(code: string): Promise<TwoFactorEnabled> {
  const body: TwoFactorEnableRequest = { code };
  // Without the device headers the new pair binds to a new device row, and this
  // browser gets emailed a new-sign-in notice about itself.
  const response = await serverApi<TwoFactorEnableResponse>(`${PATH}/enable`, {
    method: "POST",
    body,
    headers: await deviceHeaders(),
    credentialCheck: true,
  });

  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new Error("Two-factor is on but no new token pair came back.");
  }

  return {
    // An empty list is survivable here: the factor is on either way, and the
    // screen says so rather than pretending there are codes to save.
    recoveryCodes: asRecoveryCodes(response.recoveryCodes),
    tokens: { accessToken: response.token, refreshToken: response.refreshToken },
  };
}

/**
 * Turns the factor off, removing the secret and every recovery code.
 *
 * @param code A code from the app, or one recovery code. Either is spent.
 * @param password Required where the account has one.
 * @returns The fresh pair for this device, which the caller must seal. Every
 * other session is revoked here, so losing it ends this one too.
 * @throws Error when a 2xx arrives without a usable pair.
 * @throws ApiError on 401 for a wrong password or code, and 409 when there is
 * no second factor to turn off.
 */
export async function disableTwoFactor(code: string, password?: string): Promise<SignedInTokens> {
  // Without the device headers the new pair binds to a new device row, and this
  // browser gets emailed a new-sign-in notice about itself.
  const response = await serverApi<AuthResponse>(`${PATH}/disable`, {
    method: "POST",
    body: confirmBody(code, password),
    headers: await deviceHeaders(),
    credentialCheck: true,
  });

  if (typeof response?.token !== "string" || typeof response?.refreshToken !== "string") {
    throw new Error("Two-factor is off but no new token pair came back.");
  }

  return { accessToken: response.token, refreshToken: response.refreshToken };
}

/**
 * Replaces the recovery codes, invalidating the set before them.
 *
 * Sessions are untouched: the account's sign-in strength has not changed, so
 * there is no pair to seal.
 *
 * @param code A code from the app, or one of the codes being replaced.
 * @param password Required where the account has one.
 * @returns The new codes, shown this once only.
 * @throws Error when a 2xx carries no codes, since the old set is already dead
 * and there would be nothing to show in its place.
 * @throws ApiError on 401 for a wrong password or code, and 409 when there is
 * no second factor to reissue them for.
 */
export async function regenerateRecoveryCodes(code: string, password?: string): Promise<string[]> {
  const response = await serverApi<RecoveryCodesResponse>(`${PATH}/recovery-codes`, {
    method: "POST",
    body: confirmBody(code, password),
    credentialCheck: true,
  });

  const codes = asRecoveryCodes(response?.recoveryCodes);
  if (codes.length === 0) {
    throw new Error("The old recovery codes are gone but no new ones came back.");
  }

  return codes;
}
