/**
 * A chore, created or saved. One form for both, because `PUT /api/tasks/{uid}`
 * takes the chore as it will then be: a field left out is cleared, so an edit
 * posts everything a create does and the two differ only by which action runs.
 *
 * The submit is intercepted, like a group's picture, because the bytes have to
 * reach the bucket and come back as a uid before the form can be sent at all.
 * The header's Save sits outside the `<form>`, so it reaches it by `form=`.
 */

"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  createTaskAction,
  updateTaskAction,
  type TaskFormState,
} from "@/app/(app)/app/groups/[uid]/actions/actions";
import { CategoryPills } from "@/components/app/group/board/task-panel/task-form/category-pills";
import {
  CreateHeader,
  CREATE_HEADING,
  CREATE_SUBMIT,
} from "@/components/app/group/board/task-panel/task-form/create-header";
import { DueFields } from "@/components/app/group/board/task-panel/task-form/due-fields";
import {
  EditHeader,
  EDIT_HEADING,
  EDIT_SUBMIT,
} from "@/components/app/group/board/task-panel/task-form/edit-header";
import { EstimateField } from "@/components/app/group/board/task-panel/task-form/estimate-field";
import { FormRow } from "@/components/app/group/board/task-panel/task-form/form-row";
import { FIELD_INFO } from "@/components/app/group/board/task-panel/task-form/task-form.labels";
import { PhotoProofCard } from "@/components/app/group/board/task-panel/task-form/photo-proof-card/photo-proof-card";
import { PriorityPills } from "@/components/app/group/board/task-panel/task-form/priority-pills";
import { TagEditor } from "@/components/app/group/board/task-panel/task-form/tag-editor/tag-editor";
import { isPreset } from "@/components/app/group/board/task-panel/task-form/task-form.helpers";
import {
  FIELDS,
  FOOTER,
  HALVES,
} from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { FilterSelect } from "@/components/common/filter-select/filter-select";
import type { SelectOption } from "@/components/common/filter-select/filter-select.types";
import { FormNotice } from "@/components/common/form-notice";
import { ImagePicker } from "@/components/common/image-picker/image-picker";
import { SidePanel } from "@/components/common/side-panel/side-panel";
import { TextArea } from "@/components/common/text-area/text-area";
import { TextField } from "@/components/common/text-field/text-field";
import { useImageUpload } from "@/hooks/use-image-upload/use-image-upload";
import type { LabelChoice, WhoChoice } from "@/lib/tasks/filter/filter.types";
import { recurrenceLabel } from "@/lib/tasks/recurrence/recurrence";
import { RECURRENCE_TYPES } from "@/lib/tasks/tasks/tasks.types";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";
import { validateTask, type TaskValues } from "@/lib/validation/forms/task.schema/task.schema";
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_NAME_MAX_LENGTH } from "@/lib/validation/rules/rules";

type TaskEditorProps = {
  // Which action runs, and what the presses are called.
  mode: "create" | "edit";
  groupUid: string;
  // Absent while creating, which is what empties every field.
  taskUid?: string;
  values: TaskValues;
  // The picture the chore holds now, which a save carries again unless it is
  // being replaced or taken away.
  photoUid: string | null;
  categories: readonly LabelChoice[];
  tags: readonly LabelChoice[];
  members: readonly WhoChoice[];
  // Who wrote the chore down and when, kept from the panel this replaced.
  byline: string | null;
  // Where a delete leaves the reader, the chore being gone from the URL.
  closeHref: string;
  onDiscard: () => void;
  onSaved: (taskUid: string) => void;
};

const INITIAL: TaskFormState = { error: null, savedUid: null };

const CANCEL =
  "text-label-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring px-space-md flex min-h-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none";

const SAVE =
  "bg-primary text-primary-foreground hover:bg-primary-strong focus-visible:ring-ring text-label-lg px-space-lg flex min-h-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:outline-none";

/**
 * Turns the roster into the rows the assignee dropdown offers.
 *
 * @returns Nobody, then the reader, then everybody else. People who have left
 * are not offered: a chore cannot be given to somebody who is gone. The rows
 * carry membership uids, unlike the filter's, which posts a `me` token.
 */
function assigneeOptions(members: readonly WhoChoice[]): SelectOption[] {
  const here = members.filter((member) => !member.former);
  const me = here.find((member) => member.self);

  return [
    { value: "", label: "Unassigned" },
    ...(me ? [{ value: me.memberUid, label: `Me (${me.name})`, divider: true }] : []),
    ...here
      .filter((member) => !member.self)
      .map((member) => ({ value: member.memberUid, label: member.name })),
  ];
}

/** Renders the chore form in the panel, creating or saving. */
export function TaskEditor({
  mode,
  groupUid,
  taskUid,
  values,
  photoUid,
  categories,
  tags,
  members,
  byline,
  closeHref,
  onDiscard,
  onSaved,
}: Readonly<TaskEditorProps>) {
  const formId = useId();
  const action = mode === "create" ? createTaskAction : updateTaskAction;
  const [state, formAction, saving] = useActionState(action, INITIAL);
  const [fields, setFields] = useState<TaskValues>(state.values ?? values);
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [handled, setHandled] = useState<TaskFormState>(state);
  const [custom, setCustom] = useState(
    () => values.estimatedTimeMinutes !== "" && !isPreset(values.estimatedTimeMinutes),
  );
  const announced = useRef<string | null>(null);
  const image = useImageUpload({ purpose: "TASK_PHOTO", targetUid: groupUid });

  const errors = validateTask(fields);
  const kept = removed ? null : photoUid;
  const busy = image.busy || saving;
  const saved = state.savedUid;
  const creating = mode === "create";
  // Each bar owns its own words, and the panel's name and the footer's press
  // read them from there rather than saying them again.
  const kind = creating ? CREATE_HEADING : EDIT_HEADING;
  const submitLabel = creating ? CREATE_SUBMIT : EDIT_SUBMIT;

  // Adjusted in render rather than in an effect, the way React prescribes, and
  // only once per answer the action gives.
  if (handled !== state) {
    setHandled(state);
    setEdited(false);
  }

  // Leaving the editor is a side effect, so it belongs here rather than above.
  // Once per chore saved: the handler carries the board's filter, so it is a
  // new function on every render and the effect would otherwise run again.
  useEffect(() => {
    if (!saved || announced.current === saved) return;

    announced.current = saved;
    onSaved(saved);
  }, [saved, onSaved]);

  const refused = edited ? undefined : state.fieldErrors;
  const nameShown =
    (submitted || (touched && fields.name !== "") ? errors.name : undefined) ?? refused?.name;

  /** Changes one field, and marks the form edited so a refusal stops applying. */
  function set(change: Partial<TaskValues>) {
    setEdited(true);
    setFields({ ...fields, ...change });
  }

  /** Takes a stretch off the presses, which empties the box beside them. */
  function pickEstimate(estimatedTimeMinutes: string) {
    setCustom(false);
    set({ estimatedTimeMinutes });
  }

  /** Takes a stretch out of the box, which is what makes it the answer. */
  function typeEstimate(estimatedTimeMinutes: string) {
    setCustom(true);
    set({ estimatedTimeMinutes });
  }

  /** Sends the staged picture, then the form, since the uid is what it posts. */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    // Always: the save cannot start until the bytes are in the bucket, so the
    // form is dispatched by hand further down rather than by the browser.
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    data.delete("photoUid");

    if (image.staged) {
      const uid = await image.upload();
      // The picker is already showing why, and a save would clear the picture.
      if (!uid) return;
      data.set("photoUid", uid);
    } else if (kept) {
      data.set("photoUid", kept);
    }

    startTransition(() => formAction(data));
  }

  return (
    <SidePanel
      label={kind}
      close={mode === "edit" ? { press: onDiscard, back: true } : { href: closeHref }}
      header={
        creating ? (
          <CreateHeader formId={formId} saving={busy} />
        ) : (
          <EditHeader byline={byline} formId={formId} saving={busy} onDiscard={onDiscard} />
        )
      }
    >
      <form id={formId} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <input type="hidden" name="groupUid" value={groupUid} />
        {taskUid ? <input type="hidden" name="taskUid" value={taskUid} /> : null}

        {/* Posted so a browser without JavaScript keeps the picture it has: an
            omitted uid is what takes one away. */}
        {kept ? <input type="hidden" name="photoUid" value={kept} /> : null}

        <div className={FIELDS}>
          {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

          <TextField
            label="Task title"
            name="name"
            required
            autoComplete="off"
            maxLength={TASK_NAME_MAX_LENGTH}
            placeholder="Mop the kitchen floor"
            value={fields.name}
            onChange={(event) => set({ name: event.target.value })}
            onBlur={() => setTouched(true)}
            error={nameShown}
          />

          <FormRow label="Category" info={FIELD_INFO.category}>
            <CategoryPills
              categories={categories}
              value={fields.categoryId}
              onPick={(categoryId) => set({ categoryId })}
            />
          </FormRow>

          <TextArea
            label="Description"
            name="description"
            info={FIELD_INFO.description}
            rows={3}
            maxLength={TASK_DESCRIPTION_MAX_LENGTH}
            placeholder="What doing it involves, if it needs saying"
            value={fields.description}
            onChange={(event) => set({ description: event.target.value })}
            error={errors.description ?? refused?.description}
          />

          <FormRow label="Assigned to" info={FIELD_INFO.assignee}>
            <FilterSelect
              label="Who this chore is for"
              name="assignedToUid"
              options={assigneeOptions(members)}
              value={fields.assignedToUid}
            />
          </FormRow>

          <div className={HALVES}>
            <FormRow label="Repeats" info={FIELD_INFO.recurrence}>
              <FilterSelect
                label="How often this chore repeats"
                name="recurrenceType"
                options={[
                  { value: "", label: "Never" },
                  ...RECURRENCE_TYPES.map((type) => ({
                    value: type,
                    label: recurrenceLabel(type),
                  })),
                ]}
                value={fields.recurrenceType}
              />
            </FormRow>

            <FormRow
              label="Priority"
              info={FIELD_INFO.priority}
              infoEnd
              error={submitted ? errors.priority : undefined}
            >
              <PriorityPills value={fields.priority} onPick={(priority) => set({ priority })} />
            </FormRow>
          </div>

          <DueFields
            date={fields.dueDate}
            time={fields.dueTime}
            error={(submitted ? errors.dueDate : undefined) ?? refused?.dueDate}
            onDate={(dueDate) => set({ dueDate })}
            onTime={(dueTime) => set({ dueTime })}
          />

          <FormRow
            label="Estimated time to complete"
            info={FIELD_INFO.estimate}
            error={errors.estimatedTimeMinutes ?? refused?.estimatedTimeMinutes}
          >
            <EstimateField
              value={fields.estimatedTimeMinutes}
              custom={custom}
              onPick={pickEstimate}
              onType={typeEstimate}
            />
          </FormRow>

          <ImagePicker
            label="Reference image"
            info={FIELD_INFO.image}
            shape="square"
            preview={image.preview ?? uploadedImageSrc(kept)}
            busy={image.busy}
            failure={image.failure}
            onPick={(file) => {
              setEdited(true);
              setRemoved(false);
              void image.stage(file);
            }}
            onRemove={() => {
              setEdited(true);
              setRemoved(true);
              image.clear();
            }}
          />

          <FormRow label="Tags" info={FIELD_INFO.tags} error={errors.tagNames}>
            <TagEditor
              groupUid={groupUid}
              tags={tags}
              picked={fields.tagNames}
              onChange={(tagNames) => set({ tagNames })}
            />
          </FormRow>

          <PhotoProofCard
            on={fields.requiresPhotoProof}
            onToggle={() => set({ requiresPhotoProof: !fields.requiresPhotoProof })}
          />
        </div>

        <div className={FOOTER}>
          <div className="gap-space-sm flex items-center justify-end">
            <div className="gap-space-xs flex shrink-0 items-center">
              {/* A link while creating, like the header's own close: there are
                  no facts to go back to, so Cancel leaves the panel. */}
              {mode === "edit" ? (
                <button type="button" onClick={onDiscard} className={CANCEL}>
                  Cancel
                </button>
              ) : (
                <Link href={closeHref} className={CANCEL}>
                  Cancel
                </Link>
              )}

              {/* Both halves: the picker reports the upload and the action
                  reports the save, and the press covers them with no gap. */}
              <button type="submit" disabled={busy} aria-busy={busy} className={SAVE}>
                {busy ? "Saving..." : submitLabel}
              </button>
            </div>
          </div>
        </div>
      </form>
    </SidePanel>
  );
}
