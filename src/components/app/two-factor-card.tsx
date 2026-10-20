/**
 * The authenticator app as one entry in the list of methods: what state it is
 * in, and what is left of it. Whatever acts on it is passed in as children.
 */

import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { TwoFactorMethod } from "@/components/app/two-factor-method";
import {
  RECOVERY_CODES_LOW,
  RECOVERY_CODES_TOTAL,
  type TwoFactorStatus,
} from "@/lib/account/two-factor.types";

type TwoFactorCardProps = {
  status: TwoFactorStatus;
  // Formatted by the page, so dates keep one locale and one source of truth.
  confirmedOn: string | null;
  children?: ReactNode;
};

const FACT = "text-body-md text-muted-foreground";

const WARNING =
  "text-body-md bg-warning-subtle text-warning-subtle-foreground p-space-sm rounded-md";

/** Renders the state, and what is left of it when it is on. */
export function TwoFactorCard({ status, confirmedOn, children }: TwoFactorCardProps) {
  const { enabled, pendingSetup, recoveryCodesRemaining } = status;

  // A pending setup is not an on state: it does not gate a sign-in until a
  // code confirms it.
  const Icon = enabled ? ShieldCheck : pendingSetup ? ShieldAlert : Shield;

  return (
    <TwoFactorMethod
      icon={Icon}
      name="Authenticator app"
      description={
        enabled
          ? "Signing in asks for a code from your app, or one of your recovery codes."
          : pendingSetup
            ? "You started setting this up and never confirmed it, so nothing extra is asked for yet."
            : "A code from an app on your phone, on top of how you sign in now."
      }
      badge={{
        label: enabled ? "On" : pendingSetup ? "Unfinished" : "Off",
        tone: enabled ? "on" : pendingSetup ? "pending" : "off",
      }}
      active={enabled}
    >
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
            <dd className="text-body-md text-foreground">
              {recoveryCodesRemaining} of {RECOVERY_CODES_TOTAL}
            </dd>
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

      {children}
    </TwoFactorMethod>
  );
}
