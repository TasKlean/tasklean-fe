/**
 * The `/api/account/2fa` status shape, narrowed. `enabled` and `pendingSetup`
 * are not the same thing: a setup nobody confirmed does not gate a sign-in.
 */

// Hand-written from the backend's TwoFactorStatusResponse. Nothing is marked
// `required` in openapi.json, so every field is narrowed before it is used.
export type TwoFactorStatusResponse = {
  enabled?: boolean;
  pendingSetup?: boolean;
  confirmedAt?: string | null;
  recoveryCodesRemaining?: number;
};

export type TwoFactorStatus = {
  enabled: boolean;
  pendingSetup: boolean;
  // Null whenever the factor is not enabled.
  confirmedAt: Date | null;
  recoveryCodesRemaining: number;
};

/** Few enough codes left that the screen says so before they run out. */
export const RECOVERY_CODES_LOW = 3;
