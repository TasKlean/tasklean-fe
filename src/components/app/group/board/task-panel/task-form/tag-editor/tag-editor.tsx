/**
 * The tags a task carries, in a box of their own: the ones on it, and one
 * press that opens the way to another.
 *
 * Each name is posted by a hidden input rather than a tickbox, the household's
 * own list having moved behind the press. Nothing here works without
 * JavaScript, which is the standing the labels screen's rows already have.
 */

"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { AddTagPanel } from "@/components/app/group/board/task-panel/task-form/tag-editor/add-tag-panel";
import {
  CHOICE,
  CHOICE_OFF,
} from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import type { LabelChoice } from "@/lib/tasks/filter/filter.types";
import { TASK_TAGS_MAX } from "@/lib/validation/rules/rules";

type TagEditorProps = {
  groupUid: string;
  // The household's own tags, which is where a picked name's colour comes from.
  tags: readonly LabelChoice[];
  picked: readonly string[];
  onChange: (names: string[]) => void;
};

const BOX = "border-border/60 p-space-sm rounded-xl border";

const REMOVE = "text-muted-foreground hover:text-foreground -mr-1 ml-1 shrink-0 rounded-full";

// How many of the five are used, at the end of the row the chips are in. It
// turns bold at the cap, which is the only thing saying why the press died:
// `label-sm` already carries 600, so the weight has to come from its own token.
const COUNT = "ml-auto pl-space-xs shrink-0";

const COUNT_TONE = {
  off: "text-label-sm text-muted-foreground",
  full: "text-label-sm-strong text-foreground",
} as const;

/** Reports whether a name is already picked, the way the backend matches. */
function holds(picked: readonly string[], name: string): boolean {
  return picked.some((held) => held.toLowerCase() === name.toLowerCase());
}

/** Renders the task's tags and the way to add one. */
export function TagEditor({ groupUid, tags, picked, onChange }: Readonly<TagEditorProps>) {
  const [open, setOpen] = useState(false);
  // A tag made from here reaches the household only on the next read of the
  // board, so without this every new chip drew the fallback colour.
  const [learned, setLearned] = useState<Record<string, string>>({});

  const full = picked.length >= TASK_TAGS_MAX;
  const suggestions = tags.filter((tag) => !holds(picked, tag.name));

  /** The colour this tag was added with, or the one the household gave it. */
  function colorOf(name: string): string | undefined {
    const key = name.toLowerCase();

    return learned[key] ?? tags.find((tag) => tag.name.toLowerCase() === key)?.color;
  }

  return (
    <div className={BOX}>
      <div className="gap-space-xs flex flex-wrap items-center">
        {picked.map((name) => (
          <span key={name} className="flex items-center">
            <input type="hidden" name="tagNames" value={name} />

            <LabelChip
              name={name}
              color={colorOf(name)}
              kind="tag"
              trailing={
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => onChange(picked.filter((held) => held !== name))}
                  className={REMOVE}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              }
            />
          </span>
        ))}

        {open ? null : (
          <button
            type="button"
            disabled={full}
            onClick={() => setOpen(true)}
            className={`${CHOICE} ${CHOICE_OFF} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Plus className="mr-1 size-3.5 shrink-0" aria-hidden />
            Add tag
          </button>
        )}

        <p className={`${COUNT} ${full ? COUNT_TONE.full : COUNT_TONE.off}`}>
          <span aria-hidden>
            {picked.length} / {TASK_TAGS_MAX}
          </span>
          <span className="sr-only">{`${picked.length} of ${TASK_TAGS_MAX} tags used`}</span>
        </p>
      </div>

      {open ? (
        <AddTagPanel
          groupUid={groupUid}
          suggestions={suggestions}
          full={full}
          onAdd={(name, color) => {
            // The panel stays open across adds, so the cap is enforced here
            // rather than by the press that opened it.
            if (full || holds(picked, name)) return;

            if (color) setLearned((held) => ({ ...held, [name.toLowerCase()]: color }));
            onChange([...picked, name]);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
