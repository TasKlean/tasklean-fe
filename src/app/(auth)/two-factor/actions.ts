/**
 * The second-factor Server Action. The challenge it answers is read from the
 * cookie, never from the form, so nothing on screen carries the credential.
 */

"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase";
import { deviceHeaders } from "@/lib/auth/device";
import { safeNext } from "@/lib/auth/safe-next";
import {
  isAccountDeactivated,
  isChallengeDead,
  verifyTwoFactor,
} from "@/lib/auth/signin/two-factor";
import { startSession } from "@/lib/auth/start-session";
import { clearChallenge, readChallenge } from "@/lib/auth/two-factor-challenge";
import { parseTwoFactor } from "@/lib/validation/forms/two-factor.schema";

export type TwoFactorState = {
  error: string | null;
  fieldErrors?: { code?: string };
};

const GENERIC_FAILURE = "Something went wrong checking your code. Please try again.";

// Expired, spent or out of attempts: the way back in is a fresh sign-in, and
// the screen says so in one line because the backend will not say which.
const CHALLENGE_GONE = "/login?expired=2fa";

const DEACTIVATED = "/login?deactivated=1";

/**
 * Finishes a gated sign-in and starts the session.
 *
 * @returns The error to display, or nothing because it redirected.
 */
export async function verifyTwoFactorAction(
  _previous: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState> {
  const parsed = parseTwoFactor(Object.fromEntries(formData));
  if (!parsed.ok) return { error: null, fieldErrors: parsed.errors };

  const challengeToken = await readChallenge();
  // Outside the try, where redirect()'s own throw would be caught as a failure.
  if (!challengeToken) redirect(CHALLENGE_GONE);

  let leaveFor: string | null = null;

  try {
    const tokens = await verifyTwoFactor(challengeToken, parsed.values.code, await deviceHeaders());
    await clearChallenge();
    await startSession(tokens);
  } catch (error) {
    if (isAccountDeactivated(error) || isChallengeDead(error)) {
      await clearChallenge();
      leaveFor = isAccountDeactivated(error) ? DEACTIVATED : CHALLENGE_GONE;
    } else if (isApiError(error)) {
      if (error.status === 429) return { error: rateLimitMessage(error) };
      // Whatever else a 401 says here, it is about the code they just typed.
      if (error.status === 401) return { error: null, fieldErrors: { code: error.message } };
      return { error: error.message || GENERIC_FAILURE };
    } else {
      return { error: GENERIC_FAILURE };
    }
  }

  if (leaveFor) redirect(leaveFor);

  redirect(safeNext(parsed.values.next));
}
