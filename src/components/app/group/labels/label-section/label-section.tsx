/**
 * One of the two sections the labels screen holds: its heading, what the labels
 * are for, who may change them, and the card the list sits in.
 *
 * The add press sits in the heading and the form it opens at the top of the
 * card, so a household with forty labels scrolls to neither. The section owns
 * that state because it spans both halves, which is why it is a client
 * component and why the forms are built here rather than handed in.
 *
 * Only a reader who may not use a press is told why: an admin is drawn every
 * press there is, so a note listing them says nothing. A control nobody will
 * ever have is not drawn at all, where one that is merely unbuilt stays a
 * disabled button saying so.
 */

"use client";

import { Plus } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { CategoryForm } from "@/components/app/group/labels/category-form/category-form";
import { ADD_FORM, PRIMARY_BUTTON } from "@/components/app/group/labels/labels.styles";
import { TagForm } from "@/components/app/group/labels/tag-form/tag-form";

type LabelSectionProps = {
  title: string;
  description: string;
  // Why a press is missing, for the reader who may not use it. An admin is
  // told nothing, the presses being there to see.
  note?: string;
  groupUid: string;
  kind: "category" | "tag";
  // Whether to draw the add press at all: a category is wholly an admin's, and
  // a list that would not load has nothing to add to.
  canAdd: boolean;
  children: ReactNode;
};

const CARD = "p-space-lg gap-space-md bg-card border-border/60 flex flex-col rounded-xl border";

// The press shares the title's line at every width, which is the one row with
// room for it: below it the description runs the width of the section.
const TITLE_LINE = "gap-space-sm flex items-center justify-between";

/** Renders a titled section of the labels screen, and the press that adds to it. */
export function LabelSection({
  title,
  description,
  note,
  groupUid,
  kind,
  canAdd,
  children,
}: Readonly<LabelSectionProps>) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <div className={TITLE_LINE}>
          <h2 className="text-headline-sm text-foreground min-w-0">{title}</h2>

          {/* Gone while the form is open, where its own submit carries the
              label and Cancel is the way back. */}
          {canAdd && !open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`${PRIMARY_BUTTON} shrink-0`}
            >
              <Plus className="size-4" aria-hidden />
              {kind === "category" ? "Add category" : "Add tag"}
            </button>
          ) : null}
        </div>

        <p className="text-body-md text-muted-foreground max-w-prose">{description}</p>

        {note ? <p className="text-label-md text-muted-foreground max-w-prose">{note}</p> : null}
      </div>

      <div className={CARD}>
        {open ? (
          <div className={ADD_FORM}>
            {kind === "category" ? (
              <CategoryForm groupUid={groupUid} onSaved={close} onCancel={close} />
            ) : (
              <TagForm groupUid={groupUid} onSaved={close} onCancel={close} />
            )}
          </div>
        ) : null}

        {children}
      </div>
    </section>
  );
}
