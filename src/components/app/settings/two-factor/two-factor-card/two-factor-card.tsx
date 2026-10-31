/**
 * The authenticator app as one entry in the list of methods: what state it is
 * in, and what is left of it. Whatever acts on it is passed in as children.
 */

import type { ReactNode } from "react";
import { TwoFactorMethod } from "@/components/app/settings/two-factor/two-factor-method/two-factor-method";
import { stateOf } from "@/components/app/settings/two-factor/two-factor-card/state-of";
import {
  RECOVERY_CODES_LOW,
  RECOVERY_CODES_TOTAL,
  type TwoFactorStatus,
} from "@/lib/account/two-factor/two-factor.types";

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
export function TwoFactorCard({ status, confirmedOn, children }: Readonly<TwoFactorCardProps>) {
  const { enabled, recoveryCodesRemaining } = status;
  const state = stateOf(status);

  return (
    <TwoFactorMethod
      icon={state.icon}
      name="Authenticator app"
      description={state.description}
      badge={state.badge}
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
        <output className={`${WARNING} block`}>
          {recoveryCodesRemaining === 0
            ? "You have no recovery codes left. Without one, losing your phone locks you out."
            : "You are nearly out of recovery codes. A new set replaces the ones you have."}
        </output>
      ) : null}

      {children}
    </TwoFactorMethod>
  );
}
