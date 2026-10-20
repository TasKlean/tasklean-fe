/**
 * What the account's second factor currently is. Read only: enrolling,
 * turning it off and reissuing codes are not built yet.
 */

import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { RECOVERY_CODES_LOW, type TwoFactorStatus } from "@/lib/account/two-factor.types";

type TwoFactorCardProps = {
  status: TwoFactorStatus;
  // Formatted by the page, so dates keep one locale and one source of truth.
  confirmedOn: string | null;
};

const BADGE = "text-label-md rounded-full px-3 py-1 shrink-0";

const FACT = "text-body-md text-muted-foreground";

const WARNING =
  "text-body-md bg-warning-subtle text-warning-subtle-foreground p-space-sm rounded-md";

/** Renders the state, and what is left of it when it is on. */
export function TwoFactorCard({ status, confirmedOn }: TwoFactorCardProps) {
  const { enabled, pendingSetup, recoveryCodesRemaining } = status;

  // A pending setup is not an on state: it does not gate a sign-in until a
  // code confirms it.
  const Icon = enabled ? ShieldCheck : pendingSetup ? ShieldAlert : Shield;

  return (
    <div className="bg-card border-border/60 p-space-lg gap-space-md flex flex-col rounded-xl border">
      <div className="gap-space-sm flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="gap-space-sm flex items-start">
          <Icon
            className={`size-5 shrink-0 ${enabled ? "text-success-subtle-foreground" : "text-muted-foreground"}`}
            aria-hidden
          />

          <div className="gap-space-xs flex min-w-0 flex-col">
            <p className="text-label-lg text-foreground">Authenticator app</p>
            <p className={FACT}>
              {enabled
                ? "Signing in asks for a code from your app, or one of your recovery codes."
                : pendingSetup
                  ? "You started setting this up and never confirmed it, so nothing extra is asked for yet."
                  : "A code from an app on your phone, on top of how you sign in now."}
            </p>
          </div>
        </div>

        <span
          className={`${BADGE} ${
            enabled
              ? "bg-success-subtle text-success-subtle-foreground"
              : pendingSetup
                ? "bg-warning-subtle text-warning-subtle-foreground"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {enabled ? "On" : pendingSetup ? "Unfinished" : "Off"}
        </span>
      </div>

      {enabled ? (
        <dl className="gap-space-sm flex flex-col">
          {confirmedOn ? (
            <div className="gap-space-xs flex flex-wrap">
              <dt className={FACT}>Turned on</dt>
              <dd className="text-body-md text-foreground">{confirmedOn}</dd>
            </div>
          ) : null}

          <div className="gap-space-xs flex flex-wrap">
            <dt className={FACT}>Recovery codes left</dt>
            <dd className="text-body-md text-foreground">{recoveryCodesRemaining} of 10</dd>
          </div>
        </dl>
      ) : null}

      {enabled && recoveryCodesRemaining <= RECOVERY_CODES_LOW ? (
        <p role="status" className={WARNING}>
          {recoveryCodesRemaining === 0
            ? "You have no recovery codes left. Without one, losing your phone locks you out."
            : "You are nearly out of recovery codes. A new set replaces the ones you have."}
        </p>
      ) : null}
    </div>
  );
}
