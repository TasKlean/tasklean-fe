/**
 * Attaching tags without leaving the task: the group's own tags first, and the
 * way to make a new one under them, for a reader who finds none that fits.
 *
 * It stays open across adds, so several tags go on in one visit. A tag that is
 * on the task leaves the list and comes back the moment it is taken off, the
 * list being what the task does not already carry.
 *
 * **A new tag is created the moment it is added**, not when the task is saved:
 * a save posts names alone, so a colour can only be kept by the tag existing.
 * The household therefore keeps it even if the edit is then discarded, exactly
 * as adding it on the labels screen would.
 */

"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createTaskTagAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { ColorPicker } from "@/components/app/group/labels/color-picker/color-picker";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import { OrDivider } from "@/components/common/or-divider";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import type { LabelChoice } from "@/lib/tasks/filter/filter.types";
import { LABEL_NAME_MAX_LENGTH } from "@/lib/validation/rules/rules";

type AddTagPanelProps = {
  groupUid: string;
  // The household's own tags that the task does not already carry.
  suggestions: readonly LabelChoice[];
  // True once the task holds as many tags as it may, which leaves the panel
  // open with its presses dead. The box's own counter is what says why.
  full: boolean;
  // The colour rides along, since a tag made here is not in the household's
  // list the box draws from until the board is read again.
  onAdd: (name: string, color?: string) => void;
  onClose: () => void;
};

const PANEL = "border-border/60 gap-space-sm p-space-sm mt-2 flex flex-col rounded-lg border";

const HEADING = "text-label-sm text-muted-foreground";

const FIELD =
  "bg-muted text-foreground placeholder:text-muted-foreground text-body-md focus-visible:ring-ring/40 min-h-9 w-full min-w-0 rounded-full px-4 outline-none focus-visible:ring-2";

const ADD =
  "bg-primary text-primary-foreground text-label-md focus-visible:ring-ring px-space-md flex min-h-9 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:outline-none";

const CANCEL =
  "text-label-md text-muted-foreground hover:text-foreground px-space-sm flex min-h-9 shrink-0 items-center rounded-full";

// The press is the chip itself, at the size the task will wear it, so the
// panel shows what is being chosen. The wrapper carries the focus ring and
// half a step of padding, which is all the room there is to widen the target.
const CHOICE_TAG =
  "focus-visible:ring-ring flex max-w-full rounded-full p-0.5 transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

/** Renders the group's own tags, and the way to make one they do not cover. */
export function AddTagPanel({
  groupUid,
  suggestions,
  full,
  onAdd,
  onClose,
}: Readonly<AddTagPanelProps>) {
  const field = useRef<HTMLInputElement>(null);
  const firstTag = useRef<HTMLButtonElement>(null);
  const [typed, setTyped] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_SWATCH);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The panel replaced the press that asked for it, so focus follows it in:
  // onto the tags where there are any, since picking one is the common case.
  useEffect(() => {
    (firstTag.current ?? field.current)?.focus();
  }, []);

  const name = typed.trim().replace(/\s+/g, " ");
  const known = suggestions.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
  // Narrowed by what is typed, so the box doubles as the way through a long
  // list rather than only as the name of something new.
  const shown =
    name === ""
      ? suggestions
      : suggestions.filter((tag) => tag.name.toLowerCase().includes(name.toLowerCase()));

  /** Puts one tag on the task and leaves the panel ready for the next. */
  function attach(tagName: string, tagColor?: string) {
    onAdd(tagName, tagColor);
    setTyped("");
    // The pill pressed leaves the list, so focus would fall to the document.
    // The box is where a reader goes next anyway, to filter or to type a name.
    field.current?.focus();
  }

  /** Attaches the typed name, making the tag first unless it already exists. */
  async function add() {
    if (name === "" || busy) return;

    // A tag the household already holds needs no call: the task carries its
    // name, and the colour is the one it was given when it was made.
    if (known?.name) {
      attach(known.name, known.color);
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

    attach(made.name, color);
  }

  return (
    <div className={PANEL}>
      {shown.length > 0 ? (
        <div className="gap-space-xs flex flex-col">
          <p className={HEADING}>Choose one of the group&apos;s tags</p>

          <div className="gap-space-xs flex flex-wrap">
            {shown.map((tag, index) => (
              <button
                key={tag.id}
                ref={index === 0 ? firstTag : undefined}
                type="button"
                disabled={full}
                onClick={() => attach(tag.name, tag.color)}
                className={CHOICE_TAG}
              >
                <LabelChip name={tag.name} color={tag.color} kind="tag" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {shown.length > 0 ? <OrDivider /> : null}

      <div className="gap-space-xs flex flex-col">
        <p className={HEADING}>Add a new one</p>

        <div className="gap-space-xs flex items-center">
          <input
            ref={field}
            type="text"
            value={typed}
            disabled={full}
            maxLength={LABEL_NAME_MAX_LENGTH}
            aria-label="Tag name"
            placeholder="Tag name"
            onChange={(event) => setTyped(event.target.value)}
            // Enter adds the tag rather than saving the task, which is the only
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
      </div>

      {error ? (
        <p role="alert" className="text-label-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="gap-space-xs flex items-center justify-end">
        {/* A tag goes on the task the moment it is pressed, so there is
            nothing here to cancel: this press is the way out. */}
        <button type="button" onClick={onClose} className={CANCEL}>
          Done
        </button>

        <button
          type="button"
          onClick={() => void add()}
          disabled={full || name === "" || busy}
          className={ADD}
        >
          {busy ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden /> : null}
          {known ? "Attach tag" : "Create tag"}
        </button>
      </div>
    </div>
  );
}
