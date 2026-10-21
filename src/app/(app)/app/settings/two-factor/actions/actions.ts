/**
 * The two-factor section's Server Actions: starting enrollment, confirming it,
 * turning the factor off and replacing its recovery codes. None revalidates on
 * success, because each hands back something the screen has to keep showing,
 * and the codes exist nowhere else at all.
 */

"use server";

import {
  disableTwoFactor,
  enableTwoFactor,
  regenerateRecoveryCodes,
  startTwoFactorSetup,
} from "@/lib/account/two-factor/two-factor";
import type {
  ConfirmState,
  EnableState,
  SetupState,
} from "@/app/(app)/app/settings/two-factor/actions/actions.types";
import {
  credentialFailure,
  refreshOnConflict,
} from "@/app/(app)/app/settings/two-factor/actions/actions.helpers";
import { actionFailureMessage, GENERIC_FAILURE } from "@/lib/api/action-failure/action-failure";
import { isApiError } from "@/lib/api/errors";
import { startSession } from "@/lib/auth/start-session/start-session";
import { encodeQr } from "@/lib/qr/qr-code/qr-code";
import { parseTwoFactorConfirm } from "@/lib/validation/forms/two-factor-confirm.schema/two-factor-confirm.schema";
import { parseTwoFactorEnable } from "@/lib/validation/forms/two-factor-enable.schema/two-factor-enable.schema";
import { parseTwoFactorSetup } from "@/lib/validation/forms/two-factor-setup.schema/two-factor-setup.schema";

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
