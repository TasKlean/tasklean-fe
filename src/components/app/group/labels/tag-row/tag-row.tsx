/**
 * One tag in the list. The presses split by role rather than by row: any member
 * may recolour a tag, where renaming or removing one is an admin's, so a member
 * still gets the editor and it offers them the palette alone.
 */

"use client";

import { Loader2, Palette, Pencil, Trash2 } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import {
  deleteTagAction,
  type LabelActionState,
} from "@/app/(app)/app/groups/[uid]/labels/actions/actions";
import {
  CONFIRM_BUTTON,
  CONFIRM_QUESTION,
  DESTRUCTIVE_BUTTON,
  QUIET_BUTTON,
  ROW,
  ROW_ACTIONS,
  ROW_ERROR,
  ROW_LINE,
  SPINNER,
} from "@/components/app/group/labels/labels.styles";
import { TagForm } from "@/components/app/group/labels/tag-form/tag-form";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import type { TagValues } from "@/lib/validation/forms/tag.schema/tag.schema";

type TagRowProps = {
  groupUid: string;
  tag: { id: number } & TagValues;
  // Renaming and deleting only. Adding and recolouring are any member's.
  admin: boolean;
};

const INITIAL: LabelActionState = { error: null };

/** Renders one tag and the presses that change it. */
export function TagRow({ groupUid, tag, admin }: Readonly<TagRowProps>) {
  const [state, remove, removing] = useActionState(deleteTagAction, INITIAL);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const close = useCallback(() => setEditing(false), []);

  if (editing) {
    return (
      <li className={ROW}>
        <TagForm groupUid={groupUid} tag={tag} canRename={admin} onSaved={close} onCancel={close} />
      </li>
    );
  }

  return (
    <li className={ROW}>
      <div className={ROW_LINE}>
        <LabelChip name={tag.name} color={tag.color} />

        <div className={ROW_ACTIONS}>
          {confirming ? (
            <>
              <span className={CONFIRM_QUESTION}>
                Delete {tag.name}? It comes off every task carrying it.
              </span>

              <form action={remove}>
                <input type="hidden" name="groupUid" value={groupUid} />
                <input type="hidden" name="id" value={tag.id} />
                <button
                  type="submit"
                  disabled={removing}
                  aria-busy={removing}
                  className={CONFIRM_BUTTON}
                >
                  {removing ? <Loader2 className={SPINNER} aria-hidden /> : null}
                  {removing ? "Deleting" : "Delete"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={removing}
                className={QUIET_BUTTON}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {/* Named for what it does rather than "Edit": for a member the
                  editor holds the palette and nothing else. */}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={QUIET_BUTTON}
                aria-label={admin ? `Edit ${tag.name}` : `Change the colour of ${tag.name}`}
              >
                {admin ? <Pencil className="size-4" aria-hidden /> : null}
                {admin ? null : <Palette className="size-4" aria-hidden />}
                {admin ? "Edit" : "Colour"}
              </button>

              {admin ? (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className={DESTRUCTIVE_BUTTON}
                  aria-label={`Delete ${tag.name}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {state.error ? (
        <p role="alert" className={ROW_ERROR}>
          {state.error}
        </p>
      ) : null}
    </li>
  );
}
