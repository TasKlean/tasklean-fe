/**
 * One category in the list: the chip it reads as, and what an admin may do to
 * it. A client component for the editor and the confirm step, both of which are
 * its own state.
 */

"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import {
  deleteCategoryAction,
  type LabelActionState,
} from "@/app/(app)/app/groups/[uid]/labels/actions/actions";
import { CategoryForm } from "@/components/app/group/labels/category-form/category-form";
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
import { CategoryIcon } from "@/components/common/category-icon/category-icon";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import type { CategoryValues } from "@/lib/validation/forms/category.schema/category.schema";

type CategoryRowProps = {
  groupUid: string;
  category: { id: number } & CategoryValues;
  // A category is the household's filing system, so changing it is an admin's.
  canManage: boolean;
};

const INITIAL: LabelActionState = { error: null };

/** Renders one category and the presses that change it. */
export function CategoryRow({ groupUid, category, canManage }: Readonly<CategoryRowProps>) {
  const [state, remove, removing] = useActionState(deleteCategoryAction, INITIAL);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const close = useCallback(() => setEditing(false), []);

  if (editing) {
    return (
      <li className={ROW}>
        <CategoryForm groupUid={groupUid} category={category} onSaved={close} onCancel={close} />
      </li>
    );
  }

  return (
    <li className={ROW}>
      <div className={ROW_LINE}>
        <LabelChip
          name={category.name}
          color={category.color}
          icon={<CategoryIcon name={category.icon} />}
        />

        {canManage ? (
          <div className={ROW_ACTIONS}>
            {confirming ? (
              <>
                <span className={CONFIRM_QUESTION}>Delete {category.name}?</span>

                <form action={remove}>
                  <input type="hidden" name="groupUid" value={groupUid} />
                  <input type="hidden" name="id" value={category.id} />
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
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={QUIET_BUTTON}
                  aria-label={`Edit ${category.name}`}
                >
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className={DESTRUCTIVE_BUTTON}
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className={ROW_ERROR}>
          {state.error}
        </p>
      ) : null}
    </li>
  );
}
