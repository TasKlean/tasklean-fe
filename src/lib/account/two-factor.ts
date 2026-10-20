/**
 * The caller's own second factor. This reads the state only: enrolling,
 * disabling and reissuing recovery codes have no caller yet.
 */

import "server-only";

import type { TwoFactorStatus, TwoFactorStatusResponse } from "@/lib/account/two-factor.types";
import { serverApi } from "@/lib/api/server";
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
