/**
 * Writing off a round nobody did. The panel's fourth mode, state rather than a
 * URL like the editor and for the same reason: leaving it puts the facts
 * straight back and writes no history entry.
 *
 * A plain form, no interception: a skip carries a note and nothing else, so
 * there is no upload to wait for and the press works with no JavaScript.
 */

"use client";

import { SkipForward } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { skipRoundAction, type SkipRoundState } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { SKIP_INFO } from "@/components/app/group/board/task-panel/skip-form/skip-form.labels";
import { FIELDS, FOOTER } from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { FormNotice } from "@/components/common/form-notice";
import { SidePanel } from "@/components/common/side-panel/side-panel";
import { TextArea } from "@/components/common/text-area/text-area";
import { validateSkipRound } from "@/lib/validation/forms/skip-round.schema/skip-round.schema";
import { TASK_NOTE_MAX_LENGTH } from "@/lib/validation/rules/rules";

type SkipFormProps = {
  groupUid: string;
  taskUid: string;
  // The task's own name, which is what the panel is announced as.
  label: string;
  onCancel: () => void;
  onDone: (line: string) => void;
};

const INITIAL: SkipRoundState = { error: null, done: null };

const KIND = "text-label-md text-muted-foreground truncate uppercase";

const CANCEL =
  "text-label-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring px-space-md flex min-h-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none";

const SUBMIT =
  "bg-secondary text-secondary-foreground focus-visible:ring-ring text-label-lg gap-space-xs px-space-lg flex min-h-11 shrink-0 items-center justify-center rounded-full font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";

/** Renders the view that records a round as skipped. */
export function SkipForm({ groupUid, taskUid, label, onCancel, onDone }: Readonly<SkipFormProps>) {
  const [state, act, saving] = useActionState(skipRoundAction, INITIAL);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const errors = validateSkipRound({ note });

  // Reported once: the panel takes this view away on a success, and a render
  // would otherwise say so again on the way out.
  const told = useRef<SkipRoundState>(INITIAL);

  useEffect(() => {
    if (state === told.current) return;
    told.current = state;

    if (state.done) onDone(state.done);
  }, [state, onDone]);

  return (
    <SidePanel
      label={label}
      close={{ press: onCancel, back: true }}
      header={<span className={KIND}>Skip this round</span>}
    >
      <form
        action={act}
        onSubmit={() => setSubmitted(true)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <input type="hidden" name="groupUid" value={groupUid} />
        <input type="hidden" name="taskUid" value={taskUid} />

        <div className={FIELDS}>
          {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

          <FormNotice tone="info">
            This round goes down as nobody&apos;s work, and the task comes round again if it
            repeats.
          </FormNotice>

          <TextArea
            label="Reason"
            name="note"
            info={SKIP_INFO.note}
            maxLength={TASK_NOTE_MAX_LENGTH}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            error={submitted ? (errors.note ?? state.fieldErrors?.note) : undefined}
          />
        </div>

        <div className={FOOTER}>
          <div className="gap-space-sm flex items-center justify-end">
            <button type="button" onClick={onCancel} className={CANCEL}>
              Cancel
            </button>

            <button type="submit" disabled={saving} aria-busy={saving} className={SUBMIT}>
              <SkipForward className="size-4 shrink-0" aria-hidden />
              {saving ? "Skipping..." : "Skip round"}
            </button>
          </div>
        </div>
      </form>
    </SidePanel>
  );
}
