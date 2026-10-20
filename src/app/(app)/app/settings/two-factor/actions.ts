/**
 * The two-factor section's Server Actions: starting enrollment, and confirming
 * it. Neither revalidates on success. The first hands back a secret the screen
 * has to keep showing, and the second hands back recovery codes that exist
 * nowhere else, so a re-render would take them away before they were saved.
 */

"use server";

import { revalidatePath } from "next/cache";
import { enableTwoFactor, startTwoFactorSetup } from "@/lib/account/two-factor";
import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure";
import { isApiError } from "@/lib/api/errors";
import { startSession } from "@/lib/auth/start-session";
import { encodeQr } from "@/lib/qr/qr-code";
import type { QrCode } from "@/lib/qr/qr-code.types";
import { parseTwoFactorEnable } from "@/lib/validation/forms/two-factor-enable.schema";
import { parseTwoFactorSetup } from "@/lib/validation/forms/two-factor-setup.schema";

export type SetupState = {
  error: string | null;
  fieldErrors?: Partial<Record<"password", string>>;
  // What to enroll. Present means setup is pending, not that it is on.
  enrollment?: {
    secret: string;
    otpauthUri: string;
    qr: QrCode;
  };
};

export type EnableState = {
  error: string | null;
  fieldErrors?: Partial<Record<"code", string>>;
  // The factor is on. Separate from the codes, which can come back empty.
  done?: boolean;
  recoveryCodes?: string[];
};

const PATH = "/app/settings/two-factor";

/**
 * Marks the rendered page stale, for a failure that means it was.
 *
 * A 409 is the backend disagreeing about the state this screen was drawn from,
 * so the next read is the only thing that settles it.
 */
function refreshOnConflict(error: unknown): void {
  if (isApiError(error) && error.status === 409) revalidatePath(PATH);
}

/**
 * Starts enrollment and hands back the QR code and the secret behind it.
 *
 * The 401 here is the password being wrong, not the session dying, so it is
 * shown against that field.
 */
export async function startSetupAction(
  _previous: SetupState,
  formData: FormData,
): Promise<SetupState> {
  const parsed = parseTwoFactorSetup(Object.fromEntries(formData));
  if (!parsed.ok) return { error: GENERIC_FAILURE };

  try {
    // Empty means a Google-only account, which the session alone confirms.
    const setup = await startTwoFactorSetup(parsed.values.password || undefined);

    // Encoded here, not in the browser: the client bundle keeps no encoder.
    return { error: null, enrollment: { ...setup, qr: encodeQr(setup.otpauthUri) } };
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      return { error: null, fieldErrors: { password: error.message } };
    }
    refreshOnConflict(error);
    return { error: actionFailureMessage(error) };
  }
}

/**
 * Confirms the pending setup, turns the factor on and reseals the session.
 *
 * Enabling revokes every refresh token the account held, this browser's
 * included, so the pair that comes back has to replace the one in the cookie.
 */
export async function enableAction(
  _previous: EnableState,
  formData: FormData,
): Promise<EnableState> {
  const parsed = parseTwoFactorEnable(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors };

  try {
    const { recoveryCodes, tokens } = await enableTwoFactor(parsed.values.code);
    await startSession(tokens);

    return { error: null, done: true, recoveryCodes };
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      return { error: null, fieldErrors: { code: error.message } };
    }
    refreshOnConflict(error);
    return { error: actionFailureMessage(error) };
  }
}
