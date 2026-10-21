/** What each of the section's actions hands back to the screen that called it. */

import type { QrCode } from "@/lib/qr/qr-code/qr-code.types";

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
