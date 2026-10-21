/**
 * The `/api/account/2fa` shapes, narrowed. `enabled` and `pendingSetup` are not
 * the same thing: a setup nobody confirmed does not gate a sign-in.
 */

import type { SignedInTokens } from "@/lib/auth/auth.types";

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

// The password re-authenticates the caller. A Google-only account sends none
// and is confirmed by the session, the way deactivation is.
export type TwoFactorSetupRequest = {
  password?: string;
};

export type TwoFactorSetupResponse = {
  otpauthUri?: string;
  secret?: string;
};

// What the enrollment screen needs. Nothing is enabled yet: a code from the app
// has to confirm the secret first.
export type TwoFactorSetup = {
  // The Base32 secret, for typing in by hand when a camera is no use.
  secret: string;
  // The otpauth:// URI, which the QR encodes and a phone can open directly.
  otpauthUri: string;
};

export type TwoFactorEnableRequest = {
  code: string;
};

export type TwoFactorEnableResponse = {
  recoveryCodes?: string[];
  token?: string;
  refreshToken?: string;
};

// Turning it on signs every other device out, so the pair is not optional to
// persist. It carries no uid or name: the pair is all the backend answers with.
export type TwoFactorEnabled = {
  recoveryCodes: string[];
  tokens: SignedInTokens;
};

// One body for both operations that weaken an active factor. The code may be an
// authenticator one or a recovery code, and the backend spends either.
export type TwoFactorConfirmRequest = {
  password?: string;
  code: string;
};

export type RecoveryCodesResponse = {
  recoveryCodes?: string[];
};

/** Few enough codes left that the screen says so before they run out. */
export const RECOVERY_CODES_LOW = 3;

/** How many codes a fresh set holds, which is what the card counts against. */
export const RECOVERY_CODES_TOTAL = 10;
