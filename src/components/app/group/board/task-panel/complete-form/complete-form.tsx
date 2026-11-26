/**
 * Recording a round with what it took: the minutes, a note and a photo. The
 * panel's longer way to finish a task, and the only way to finish one that
 * asks for proof.
 *
 * The submit is intercepted like the task's own form, because the bytes have
 * to reach the bucket and come back as a uid before the round can be posted.
 */

"use client";

import { Camera } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  completeTaskAction,
  type CompleteTaskState,
} from "@/app/(app)/app/groups/[uid]/actions/actions";
import { ROUND_INFO } from "@/components/app/group/board/task-panel/complete-form/complete-form.labels";
import { EstimateField } from "@/components/app/group/board/task-panel/task-form/estimate-field";
import { FormRow } from "@/components/app/group/board/task-panel/task-form/form-row";
import { FIELDS, FOOTER } from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { FormNotice } from "@/components/common/form-notice";
import { ImagePicker } from "@/components/common/image-picker/image-picker";
import { SidePanel } from "@/components/common/side-panel/side-panel";
import { TextArea } from "@/components/common/text-area/text-area";
import { useImageUpload } from "@/hooks/use-image-upload/use-image-upload";
import {
  validateCompleteTask,
  type CompleteTaskValues,
} from "@/lib/validation/forms/complete-task.schema/complete-task.schema";
import { TASK_NOTE_MAX_LENGTH } from "@/lib/validation/rules/rules";

type CompleteFormProps = {
  groupUid: string;
  taskUid: string;
  // The task's own name, which is what the panel is announced as.
  label: string;
  // Whether a photo is the point of this view or merely offered in it.
  requiresProof: boolean;
  onCancel: () => void;
  onDone: (line: string) => void;
};

const INITIAL: CompleteTaskState = { error: null, done: null };

const EMPTY: CompleteTaskValues = { minutes: "", note: "" };

const KIND = "text-label-md text-muted-foreground truncate uppercase";

const CANCEL =
  "text-label-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring px-space-md flex min-h-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none";

const SUBMIT =
  "bg-primary text-primary-foreground hover:bg-primary-strong focus-visible:ring-ring text-label-lg gap-space-xs px-space-lg flex min-h-11 shrink-0 items-center justify-center rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";

const NEEDS_PHOTO = "This task needs a photo to be marked done.";

/** Renders the longer way to finish a task, and the only way with proof. */
export function CompleteForm({
  groupUid,
  taskUid,
  label,
  requiresProof,
  onCancel,
  onDone,
}: Readonly<CompleteFormProps>) {
  const [state, act, saving] = useActionState(completeTaskAction, INITIAL);
  const [fields, setFields] = useState<CompleteTaskValues>(EMPTY);
  const [custom, setCustom] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const image = useImageUpload({ purpose: "COMPLETION_PHOTO", targetUid: taskUid });

  const errors = validateCompleteTask(fields);
  const busy = image.busy || saving;
  const missingPhoto = requiresProof && submitted && !image.staged;

  // Reported once: the panel takes this view away on a success, and a render
  // would otherwise say so again on the way out.
  const told = useRef<CompleteTaskState>(INITIAL);

  useEffect(() => {
    if (state === told.current) return;
    told.current = state;

    if (state.done) onDone(state.done);
  }, [state, onDone]);

  /** Picks one of the stretches, or clears the one already on. */
  function pickMinutes(minutes: string) {
    setCustom(false);
    setFields((current) => ({ ...current, minutes }));
  }

  /** Takes a typed stretch, which is the box rather than the presses. */
  function typeMinutes(minutes: string) {
    setCustom(true);
    setFields((current) => ({ ...current, minutes }));
  }

  /** Sends the staged photo, then the round, since the uid is what it posts. */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    // Always: the round cannot be posted until the bytes are in the bucket, so
    // the form is dispatched by hand below rather than by the browser.
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    // The picker is already saying so, and the backend would refuse it anyway.
    if (requiresProof && !image.staged) return;

    if (image.staged) {
      const uid = await image.upload();
      if (!uid) return;
      data.set("photoUid", uid);
    }

    startTransition(() => act(data));
  }

  return (
    <SidePanel
      label={label}
      close={{ press: onCancel, back: true }}
      header={<span className={KIND}>Mark as done</span>}
    >
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <input type="hidden" name="groupUid" value={groupUid} />
        <input type="hidden" name="taskUid" value={taskUid} />

        <div className={FIELDS}>
          {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

          <FormRow
            label="How long it took"
            info={ROUND_INFO.minutes}
            infoBelow
            error={submitted ? (errors.minutes ?? state.fieldErrors?.minutes) : undefined}
          >
            <EstimateField
              label="How long it took"
              name="minutes"
              value={fields.minutes}
              custom={custom}
              onPick={pickMinutes}
              onType={typeMinutes}
            />
          </FormRow>

          <TextArea
            label="Note"
            name="note"
            info={ROUND_INFO.note}
            maxLength={TASK_NOTE_MAX_LENGTH}
            value={fields.note}
            onChange={(event) => setFields((current) => ({ ...current, note: event.target.value }))}
            error={submitted ? (errors.note ?? state.fieldErrors?.note) : undefined}
          />

          <ImagePicker
            label={requiresProof ? "Photo proof" : "Photo"}
            info={ROUND_INFO.photo}
            preview={image.preview}
            busy={image.busy}
            failure={image.failure ?? (missingPhoto ? NEEDS_PHOTO : null)}
            onPick={(file) => void image.stage(file)}
            onRemove={image.clear}
          />
        </div>

        <div className={FOOTER}>
          <div className="gap-space-sm flex items-center justify-end">
            <button type="button" onClick={onCancel} className={CANCEL}>
              Cancel
            </button>

            <button type="submit" disabled={busy} aria-busy={busy} className={SUBMIT}>
              <Camera className="size-4 shrink-0" aria-hidden />
              {busy ? "Recording..." : "Mark as done"}
            </button>
          </div>
        </div>
      </form>
    </SidePanel>
  );
}
