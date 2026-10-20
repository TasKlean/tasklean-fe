/**
 * The caller's own second factor: reading it, and turning it on. Both writes
 * check a credential we just sent, so their 401 is that credential's verdict
 * and not the session dying. Disabling and reissuing codes have no caller yet.
 */

import "server-only";

import type {
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

  const codes = response.recoveryCodes;

  return {
    // An empty list is survivable: the factor is on either way, and the screen
    // says so rather than pretending there are codes to save.
    recoveryCodes: Array.isArray(codes) ? codes.filter((code) => typeof code === "string") : [],
    tokens: { accessToken: response.token, refreshToken: response.refreshToken },
  };
}
