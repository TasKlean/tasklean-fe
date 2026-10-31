/**
 * One way of proving a second factor, as a card. The shell is shared so a
 * method nobody can turn on yet still reads as part of the same list, and so
 * adding one is a matter of listing it rather than of designing it.
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type TwoFactorMethodProps = {
  icon: LucideIcon;
  name: string;
  description: string;
  // The state of this method. Absent while there is no state to be in.
  badge?: { label: string; tone: "on" | "pending" | "off" };
  // Tints the icon, for the method actually guarding the account.
  active?: boolean;
  // False where the backend has no such factor yet. The card stays listed,
  // because a dead button says more about what is coming than a gap does.
  available?: boolean;
  children?: ReactNode;
};

const BADGE = "text-label-md shrink-0 rounded-full px-3 py-1";

const TONES = {
  on: "bg-success-subtle text-success-subtle-foreground",
  pending: "bg-warning-subtle text-warning-subtle-foreground",
  off: "bg-muted text-muted-foreground",
} as const;

/** Renders one method, with whatever it offers below the description. */
export function TwoFactorMethod({
  icon: Icon,
  name,
  description,
  badge,
  active = false,
  available = true,
  children,
}: Readonly<TwoFactorMethodProps>) {
  return (
    <div className="bg-card border-border/60 p-space-lg gap-space-sm flex items-start rounded-xl border">
      <Icon
        className={`size-5 shrink-0 ${active ? "text-success-subtle-foreground" : "text-muted-foreground"}`}
        aria-hidden
      />

      {/* One column beside the icon, so what a method offers lines up with its
          name rather than starting at the card's own edge. */}
      <div className="gap-space-md flex min-w-0 flex-1 flex-col">
        {/* A row at every width: stacked, the badge is a flex item that
            stretches across the column rather than reading as a pill. */}
        <div className="gap-space-sm flex items-start justify-between">
          <div className="gap-space-xs flex min-w-0 flex-col">
            <p className="text-label-lg text-foreground">{name}</p>
            <p className="text-body-md text-muted-foreground">{description}</p>
          </div>

          {badge ? <span className={`${BADGE} ${TONES[badge.tone]}`}>{badge.label}</span> : null}
        </div>

        {available ? (
          children
        ) : (
          <button
            type="button"
            disabled
            className="text-label-md px-space-md border-border/60 text-muted-foreground flex min-h-11 w-fit cursor-not-allowed items-center rounded-full border"
          >
            Coming soon
          </button>
        )}
      </div>
    </div>
  );
}
