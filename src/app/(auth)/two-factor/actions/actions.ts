/**
 * The second-factor Server Action. The challenge it answers is read from the
 * cookie, never from the form, so nothing on screen carries the credential.
 */

"use server";

import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { rateLimitMessage } from "@/lib/api/retry-phrase/retry-phrase";
import { deviceHeaders } from "@/lib/auth/device/device";
import { safeNext } from "@/lib/auth/safe-next/safe-next";
import {
  isAccountDeactivated,
  isChallengeDead,
  verifyTwoFactor,
} from "@/lib/auth/signin/two-factor/two-factor";
import { startSession } from "@/lib/auth/start-session/start-session";
import {
  clearChallenge,
  readChallenge,
} from "@/lib/auth/two-factor-challenge/two-factor-challenge";
import { parseTwoFactor } from "@/lib/validation/forms/two-factor.schema/two-factor.schema";

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
 * Decides what a refused verification ends in.
 *
 * @returns Either a path the attempt has to leave for, which means the
 * challenge is spent, or the state to show so the code can be retyped.
 */
function endingFor(
  error: unknown,
): { kind: "leave"; to: string } | { kind: "state"; state: TwoFactorState } {
  if (isAccountDeactivated(error)) return { kind: "leave", to: DEACTIVATED };
  if (isChallengeDead(error)) return { kind: "leave", to: CHALLENGE_GONE };
  if (!isApiError(error)) return { kind: "state", state: { error: GENERIC_FAILURE } };

  if (error.status === 429) return { kind: "state", state: { error: rateLimitMessage(error) } };
  // Whatever else a 401 says here, it is about the code they just typed.
  if (error.status === 401) {
    return { kind: "state", state: { error: null, fieldErrors: { code: error.message } } };
  }

  return { kind: "state", state: { error: error.message || GENERIC_FAILURE } };
}

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
    const ending = endingFor(error);
    if (ending.kind === "state") return ending.state;

    await clearChallenge();
    leaveFor = ending.to;
  }

  // Outside the catch, where redirect()'s own throw would look like a failure.
  if (leaveFor) redirect(leaveFor);

  redirect(safeNext(parsed.values.next));
}
