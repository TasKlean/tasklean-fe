/**
 * The press that adds a label, which swaps itself for the form. The list reads
 * first and the fields appear only when they are wanted, the same way a
 * destructive press reveals its question in place rather than in a dialog.
 */

"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { CategoryForm } from "@/components/app/group/labels/category-form/category-form";
import { QUIET_BUTTON } from "@/components/app/group/labels/labels.styles";
import { TagForm } from "@/components/app/group/labels/tag-form/tag-form";

type AddLabelProps = {
  groupUid: string;
  kind: "category" | "tag";
};

/** Renders the add press, or the form it opens. */
export function AddLabel({ groupUid, kind }: Readonly<AddLabelProps>) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${QUIET_BUTTON} self-start`}>
        <Plus className="size-4" aria-hidden />
        {kind === "category" ? "Add category" : "Add tag"}
      </button>
    );
  }

  return kind === "category" ? (
    <CategoryForm groupUid={groupUid} onSaved={close} onCancel={close} />
  ) : (
    <TagForm groupUid={groupUid} onSaved={close} onCancel={close} />
  );
}
