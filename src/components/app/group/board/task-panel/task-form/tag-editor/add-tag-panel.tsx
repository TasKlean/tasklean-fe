/**
 * Making a tag without leaving the chore. A name and a colour, or one press on
 * a tag the household already has.
 *
 * **A new tag is created the moment it is added**, not when the chore is saved:
 * a save posts names alone, so a colour can only be kept by the tag existing.
 * The household therefore keeps it even if the edit is then discarded, exactly
 * as adding it on the labels screen would.
 */

"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createTaskTagAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { Swatch } from "@/components/common/swatch/swatch";
import {
  CHOICE,
  CHOICE_OFF,
} from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { ColorPicker } from "@/components/app/group/labels/color-picker/color-picker";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import type { LabelChoice } from "@/lib/tasks/filter/filter.types";
import { LABEL_NAME_MAX_LENGTH } from "@/lib/validation/rules/rules";

type AddTagPanelProps = {
  groupUid: string;
  // The household's own tags that the chore does not already carry.
  suggestions: readonly LabelChoice[];
  // The colour rides along, since a tag made here is not in the household's
  // list the box draws from until the board is read again.
  onAdd: (name: string, color?: string) => void;
  onClose: () => void;
};

const PANEL = "border-border/60 gap-space-sm p-space-sm mt-2 flex flex-col rounded-lg border";

const FIELD =
  "bg-muted text-foreground placeholder:text-muted-foreground text-body-md focus-visible:ring-ring/40 min-h-9 w-full min-w-0 rounded-full px-4 outline-none focus-visible:ring-2";

const ADD =
  "bg-primary text-primary-foreground text-label-md focus-visible:ring-ring px-space-md flex min-h-9 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:outline-none";

const CANCEL =
  "text-label-md text-muted-foreground hover:text-foreground px-space-sm flex min-h-9 shrink-0 items-center rounded-full";

/** Renders the way to attach an existing tag or make a new one. */
export function AddTagPanel({ groupUid, suggestions, onAdd, onClose }: Readonly<AddTagPanelProps>) {
  const field = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_SWATCH);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The box is here because a press asked for it, so it takes focus. A ref
  // rather than `autoFocus`, which cannot tell that from a page that loaded.
  useEffect(() => {
    field.current?.focus();
  }, []);

  const name = typed.trim().replace(/\s+/g, " ");
  const known = suggestions.find((tag) => tag.name.toLowerCase() === name.toLowerCase());

  /** Attaches the typed name, making the tag first unless it already exists. */
  async function add() {
    if (name === "" || busy) return;

    // A tag the household already holds needs no call: the chore carries its
    // name, and the colour is the one it was given when it was made.
    if (known?.name) {
      onAdd(known.name, known.color);
      onClose();
      return;
    }

    setBusy(true);
    setError(null);
    const made = await createTaskTagAction(groupUid, name, color);
    setBusy(false);

    if (!made.name) {
      setError(made.error);
      return;
    }

    onAdd(made.name, color);
    onClose();
  }

  return (
    <div className={PANEL}>
      <div className="gap-space-xs flex items-center">
        <input
          ref={field}
          type="text"
          value={typed}
          maxLength={LABEL_NAME_MAX_LENGTH}
          aria-label="Tag name"
          placeholder="Tag name"
          onChange={(event) => setTyped(event.target.value)}
          // Enter adds the tag rather than saving the chore, which is the only
          // thing a press here could reasonably mean.
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            void add();
          }}
          className={FIELD}
        />

        {known ? null : <ColorPicker value={color} align="end" onChange={setColor} />}
      </div>

      {suggestions.length > 0 ? (
        <div className="gap-space-xs flex flex-wrap">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                onAdd(tag.name, tag.color);
                onClose();
              }}
              className={`${CHOICE} ${CHOICE_OFF}`}
            >
              <Swatch color={tag.color} />
              <span className="ml-1">{tag.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-label-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="gap-space-xs flex items-center justify-end">
        <button type="button" onClick={onClose} className={CANCEL}>
          Cancel
        </button>

        <button
          type="button"
          onClick={() => void add()}
          disabled={name === "" || busy}
          className={ADD}
        >
          {busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden /> : null}
          {known ? "Attach tag" : "Add tag"}
        </button>
      </div>
    </div>
  );
}
