/**
 * The two-factor section's Server Actions: starting enrollment, confirming it,
 * turning the factor off and replacing its recovery codes. None revalidates on
 * success, because each hands back something the screen has to keep showing,
 * and the codes exist nowhere else at all.
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  disableTwoFactor,
  enableTwoFactor,
  regenerateRecoveryCodes,
  startTwoFactorSetup,
} from "@/lib/account/two-factor";
import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure";
import { PASSWORD_INVALID } from "@/lib/api/error-codes";
import { isApiError } from "@/lib/api/errors";
import { startSession } from "@/lib/auth/start-session";
import { encodeQr } from "@/lib/qr/qr-code";
import type { QrCode } from "@/lib/qr/qr-code.types";
import { parseTwoFactorConfirm } from "@/lib/validation/forms/two-factor-confirm.schema";
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

// What the state of an operation that weakens the factor can be. One shape for
// both, since they ask the same two things and differ only in what comes back.
export type ConfirmState = {
  error: string | null;
  fieldErrors?: Partial<Record<"password" | "code", string>>;
  done?: boolean;
  // Only reissuing hands these back, and only this once.
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

/**
 * Routes a refused credential to the field it is about.
 *
 * Both credentials answer 401, so the envelope's code is the only thing that
 * tells them apart. Anything else lands on the code, which is the field every
 * one of these forms has.
 *
 * @returns The state to show, or null when this failure was something else.
 */
function credentialFailure(error: unknown): ConfirmState | null {
  if (!isApiError(error) || error.status !== 401) return null;

  const field = error.code === PASSWORD_INVALID ? "password" : "code";
  return { error: null, fieldErrors: { [field]: error.message } };
}

/**
 * Turns the factor off and reseals the session with the pair that comes back.
 *
 * Disabling revokes every other refresh token, so the new pair has to replace
 * the one in the cookie. That write re-renders this page with the factor off.
 */
export async function disableAction(
  _previous: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const parsed = parseTwoFactorConfirm(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors };

  try {
    // Empty means a Google-only account, which the session alone confirms.
    const tokens = await disableTwoFactor(parsed.values.code, parsed.values.password || undefined);
    await startSession(tokens);

    return { error: null, done: true };
  } catch (error) {
    const refused = credentialFailure(error);
    if (refused) return refused;

    refreshOnConflict(error);
    return { error: actionFailureMessage(error) };
  }
}

/**
 * Replaces the recovery codes and hands back the new set.
 *
 * Nothing is revalidated: the codes it returns are stored nowhere else, so the
 * screen holding them has to outlive the call that produced them.
 */
export async function regenerateCodesAction(
  _previous: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const parsed = parseTwoFactorConfirm(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors };

  try {
    const recoveryCodes = await regenerateRecoveryCodes(
      parsed.values.code,
      parsed.values.password || undefined,
    );

    return { error: null, done: true, recoveryCodes };
  } catch (error) {
    const refused = credentialFailure(error);
    if (refused) return refused;

    refreshOnConflict(error);
    return { error: actionFailureMessage(error) };
  }
}
