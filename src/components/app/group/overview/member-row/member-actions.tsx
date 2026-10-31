/**
 * The two things an admin does to someone else's membership. The role button
 * posts the role it would set rather than the one it sees, so the form carries
 * the whole instruction and nothing is worked out twice.
 */

import { Loader2, ShieldCheck, ShieldMinus, Trash2 } from "lucide-react";
import {
  BUTTON,
  DESTRUCTIVE_BUTTON,
  SPINNER,
} from "@/components/app/group/overview/member-row/member-row.styles";

type MemberActionsProps = {
  groupUid: string;
  memberUid: string;
  name: string;
  admin: boolean;
  changeRole: (formData: FormData) => void;
  changing: boolean;
  busy: boolean;
  onRemove: () => void;
};

/** Renders the role change and the removal a member's row offers. */
export function MemberActions({
  groupUid,
  memberUid,
  name,
  admin,
  changeRole,
  changing,
  busy,
  onRemove,
}: Readonly<MemberActionsProps>) {
  const Icon = admin ? ShieldMinus : ShieldCheck;
  const label = admin ? "Make member" : "Make admin";

  return (
    <>
      <form action={changeRole}>
        <input type="hidden" name="groupUid" value={groupUid} />
        <input type="hidden" name="memberUid" value={memberUid} />
        <input type="hidden" name="role" value={admin ? "GROUP_MEMBER" : "GROUP_ADMIN"} />
        <button
          type="submit"
          disabled={busy}
          aria-busy={changing}
          aria-label={`${label}: ${name}`}
          className={`${BUTTON} border-border/60 text-foreground hover:bg-muted`}
        >
          {changing ? (
            <Loader2 className={SPINNER} aria-hidden />
          ) : (
            <Icon className="size-4" aria-hidden />
          )}
          {changing ? "Saving" : label}
        </button>
      </form>

      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        aria-label={`Remove ${name}`}
        className={DESTRUCTIVE_BUTTON}
      >
        <Trash2 className="size-4" aria-hidden />
        Remove
      </button>
    </>
  );
}
