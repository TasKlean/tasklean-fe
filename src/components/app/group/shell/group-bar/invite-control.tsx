/**
 * The invite half of a group's bottom bar: the press, and the code it opens.
 * No replacement here, because issuing a new code locks out everyone holding
 * the old one and that warning does not fit in a panel this size.
 */

"use client";

import { UserPlus } from "lucide-react";
import { useId } from "react";
import {
  ACTIVE,
  CONTROL,
  PANEL,
  RESTING,
} from "@/components/app/group/shell/group-bar/group-bar.styles";
import { InviteCodeField } from "@/components/common/invite-code/invite-code-field";
import { ShareInvite } from "@/components/common/invite-code/share-invite";

type InviteControlProps = {
  code: string;
  open: boolean;
  // Whether this is the control carrying a label, since the bar has room for
  // exactly one at a time.
  named: boolean;
  onPress: (pressed: HTMLButtonElement) => void;
};

/** Renders the invite press and its panel. */
export function InviteControl({ code, open, named, onPress }: Readonly<InviteControlProps>) {
  const panelId = useId();

  return (
    <div className="flex-1">
      <button
        type="button"
        aria-label="Invite someone"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={(event) => onPress(event.currentTarget)}
        className={`${CONTROL} ${open ? ACTIVE : RESTING}`}
      >
        <UserPlus className="size-5 shrink-0" aria-hidden />
        <span className={named ? "" : "hidden"}>Invite</span>
      </button>

      {open ? (
        <div id={panelId} className={`${PANEL} p-space-md gap-space-sm flex w-72 flex-col`}>
          <p className="text-label-md text-muted-foreground">Anyone holding this code can join.</p>

          <div className="gap-space-sm flex items-center">
            <InviteCodeField code={code} />
            <ShareInvite />
          </div>
        </div>
      ) : null}
    </div>
  );
}
