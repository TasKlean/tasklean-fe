/**
 * Deleting a group, which takes its tasks and every membership with it and
 * nothing undoes. The confirmation asks for the group's name rather than a
 * second press, since a press is what somebody does by accident.
 */

"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import {
  deleteGroupAction,
  type GroupActionState,
} from "@/app/(app)/app/groups/[uid]/settings/actions/actions";
import {
  CONFIRM_BUTTON,
  DESTRUCTIVE_BUTTON,
  QUIET_BUTTON,
  SPINNER,
} from "@/components/app/group/settings/group-settings.styles";
import { TextField } from "@/components/common/text-field/text-field";

type DeleteGroupProps = {
  groupUid: string;
  name: string;
};

const INITIAL: GroupActionState = { error: null };

// Spelled out before the press rather than after it: the section's lead says
// the group goes, and this is what "the group" turns out to include.
const LOSSES = [
  "Every task in the group, with its history and who completed it.",
  "Every tag and category the group has made.",
  "Everybody's membership, so the group leaves their list as well as yours.",
  "The invite code, which stops working for anyone still holding it.",
];

/** Renders the control that ends a group, and the name it asks for first. */
export function DeleteGroup({ groupUid, name }: Readonly<DeleteGroupProps>) {
  const [state, remove, removing] = useActionState(deleteGroupAction, INITIAL);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  // The field appears on a press, so it takes focus here rather than through
  // `autoFocus`, which cannot tell the two cases apart.
  const focusOnOpen = useCallback((field: HTMLInputElement | null) => field?.focus(), []);

  const matches = typed.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase();

  if (!confirming) {
    return (
      <div className="gap-space-md flex max-w-2xl flex-col">
        <div className="gap-space-sm flex flex-col">
          <p className="text-body-md text-foreground">Deleting this group takes with it:</p>

          <ul className="gap-space-xs text-body-md text-muted-foreground flex list-disc flex-col pl-5">
            {LOSSES.map((loss) => (
              <li key={loss}>{loss}</li>
            ))}
          </ul>

          <p className="text-body-md text-destructive">
            Nothing here can be undone, and nobody is asked first.
          </p>
        </div>

        <div className="flex">
          <button type="button" onClick={() => setConfirming(true)} className={DESTRUCTIVE_BUTTON}>
            <Trash2 className="size-4" aria-hidden />
            Delete group
          </button>
        </div>

        {state.error ? (
          <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
            {state.error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={remove} className="gap-space-md flex max-w-2xl flex-col">
      <input type="hidden" name="groupUid" value={groupUid} />

      <p className="text-body-md text-destructive max-w-prose">
        Every task, tag and membership in this group goes with it, for everybody. Type the group
        name to confirm.
      </p>

      <TextField
        label={`Type "${name}" to confirm`}
        name="confirmation"
        autoComplete="off"
        ref={focusOnOpen}
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
      />

      <div className="gap-space-xs flex flex-wrap items-center">
        <button
          type="submit"
          disabled={!matches || removing}
          aria-busy={removing}
          className={CONFIRM_BUTTON}
        >
          {removing ? (
            <Loader2 className={SPINNER} aria-hidden />
          ) : (
            <Trash2 className="size-4" aria-hidden />
          )}
          {removing ? "Deleting" : "Delete this group"}
        </button>

        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setTyped("");
          }}
          disabled={removing}
          className={QUIET_BUTTON}
        >
          Cancel
        </button>
      </div>

      {state.error ? (
        <p role="alert" className="text-label-sm text-destructive-subtle-foreground">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
