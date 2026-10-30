/**
 * One membership in the roster. A client component for the pending states and
 * the confirm step; an admin gets the controls for everybody but themselves,
 * since their own membership is ended by leaving rather than by removal.
 */

"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import {
  changeMemberRoleAction,
  removeMemberAction,
  type MemberActionState,
} from "@/app/(app)/app/groups/[uid]/members/actions/actions";
import { ConfirmRemove } from "@/components/app/member-row/confirm-remove";
import { MemberActions } from "@/components/app/member-row/member-actions";
import { CHIP } from "@/components/app/member-row/member-row.styles";
import { Avatar } from "@/components/common/avatar/avatar";

type MemberRowProps = {
  groupUid: string;
  // Null when the membership arrived without one, which leaves nothing to act
  // on: the row still names the person, it just offers no buttons.
  memberUid: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  role: string;
  admin: boolean;
  joined: string | null;
  you: boolean;
  manageable: boolean;
};

const INITIAL: MemberActionState = { error: null };

/** Renders a member, their standing in the group, and what may be done to it. */
export function MemberRow({
  groupUid,
  memberUid,
  name,
  firstName,
  lastName,
  photoUrl,
  role,
  admin,
  joined,
  you,
  manageable,
}: Readonly<MemberRowProps>) {
  const [roleState, changeRole, changing] = useActionState(changeMemberRoleAction, INITIAL);
  const [removeState, remove, removing] = useActionState(removeMemberAction, INITIAL);
  const [confirming, setConfirming] = useState(false);

  const busy = changing || removing;
  const error = roleState.error ?? removeState.error;

  let controls: ReactNode = null;
  if (manageable && memberUid) {
    controls = confirming ? (
      <ConfirmRemove
        groupUid={groupUid}
        memberUid={memberUid}
        name={name}
        remove={remove}
        removing={removing}
        busy={busy}
        onCancel={() => setConfirming(false)}
      />
    ) : (
      <MemberActions
        groupUid={groupUid}
        memberUid={memberUid}
        name={name}
        admin={admin}
        changeRole={changeRole}
        changing={changing}
        busy={busy}
        onRemove={() => setConfirming(true)}
      />
    );
  }

  return (
    <li className="bg-card border-border/60 p-space-lg gap-space-md flex items-start rounded-xl border">
      <Avatar photoUrl={photoUrl} name={firstName} lastName={lastName} />

      <div className="gap-space-md flex min-w-0 flex-1 flex-col">
        <div className="gap-space-md flex items-start justify-between">
          <div className="gap-space-xs flex min-w-0 flex-col">
            <span className="text-label-lg text-foreground break-words">{name}</span>
            {joined ? <span className="text-label-sm text-muted-foreground">{joined}</span> : null}
          </div>

          {/* Stacked on a phone, where two pills beside the name would truncate
              it, and the top inset drops the first onto the name's own line. */}
          <div className="gap-space-xs flex shrink-0 flex-col items-end pt-0.5 sm:flex-row sm:items-center sm:pt-0">
            {you ? <span className={`${CHIP} bg-primary text-primary-foreground`}>You</span> : null}
            <span
              className={`${CHIP} ${admin ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {role}
            </span>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
            {error}
          </p>
        ) : null}

        {controls ? (
          <div className="gap-space-xs flex flex-wrap items-center">{controls}</div>
        ) : null}
      </div>
    </li>
  );
}
