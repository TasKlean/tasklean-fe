/**
 * A group's name, description and picture, edited in place. The fields start
 * from what the backend answered with and a save re-renders the shell, so the
 * rail's heading and the list's card follow the same press.
 *
 * The picture is a file, and a save is a full replace: `PUT /api/groups/{uid}`
 * takes the group as it will then be, so leaving `photoUid` out is how a
 * picture is removed and a save that keeps one has to post the uid the group
 * already holds. That is why the submit is intercepted: the bytes have to reach
 * the bucket and come back as a uid before the form can be sent at all.
 */

"use client";

import type { FormEvent } from "react";
import { startTransition, useActionState, useState } from "react";
import {
  updateGroupDetailsAction,
  type GroupDetailsState,
} from "@/app/(app)/app/groups/[uid]/settings/actions/actions";
import { FormNotice } from "@/components/common/form-notice";
import { ImagePicker } from "@/components/common/image-picker/image-picker";
import { SubmitButton } from "@/components/common/submit-button";
import { TextArea } from "@/components/common/text-area/text-area";
import { TextField } from "@/components/common/text-field/text-field";
import { useImageUpload } from "@/hooks/use-image-upload/use-image-upload";
import { groupPhotoSrc } from "@/lib/groups/photo/photo";
import {
  validateEditGroup,
  type EditGroupValues,
} from "@/lib/validation/forms/edit-group.schema/edit-group.schema";
import { GROUP_DESCRIPTION_MAX_LENGTH, GROUP_NAME_MAX_LENGTH } from "@/lib/validation/rules/rules";

type EditGroupFormProps = {
  groupUid: string;
  name: string;
  description: string;
  // The picture the group holds now, which a save has to carry again unless it
  // is being replaced or taken away.
  photoUid: string | null;
};

const INITIAL: GroupDetailsState = { error: null, saved: false };

/** Renders the form that changes a group's details. */
export function EditGroupForm({
  groupUid,
  name,
  description,
  photoUid,
}: Readonly<EditGroupFormProps>) {
  const [state, formAction] = useActionState(updateGroupDetailsAction, INITIAL);
  const [fields, setFields] = useState<EditGroupValues>(state.values ?? { name, description });
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [handled, setHandled] = useState<GroupDetailsState>(state);
  const image = useImageUpload({ purpose: "GROUP_PHOTO", targetUid: groupUid });

  const errors = validateEditGroup(fields);
  const kept = removed ? null : photoUid;

  // Adjusted in render rather than in an effect, the way React prescribes, and
  // only once per answer the action gives.
  if (handled !== state) {
    setHandled(state);
    setEdited(false);
  }

  const refused = edited ? undefined : state.fieldErrors;
  const nameShown =
    (submitted || (touched && fields.name !== "") ? errors.name : undefined) ?? refused?.name;

  /** Sends the staged picture, then the form, since the uid is what it posts. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Always: the save cannot start until the bytes are in the bucket, so the
    // form is dispatched by hand further down rather than by the browser.
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSubmitted(true);
    if (errors.name || errors.description) return;

    data.delete("photoUid");

    if (image.staged) {
      const uid = await image.upload();
      // The picker is already showing why, and a save would clear the picture.
      if (!uid) return;
      data.set("photoUid", uid);
    } else if (kept) {
      data.set("photoUid", kept);
    }

    // Dispatched by hand, so the transition is ours to open: without one React
    // never reports the save as pending.
    startTransition(() => formAction(data));
  }

  return (
    // Bounded, because the group's own column is the width of the window less
    // the rail: a name field and a primary pill 830px wide read as a page, not
    // as one card's control.
    <div className="gap-space-md flex max-w-2xl flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}
      {state.saved && !edited ? <FormNotice tone="success">Group details saved.</FormNotice> : null}

      <form onSubmit={handleSubmit} className="gap-space-md flex flex-col" noValidate>
        <input type="hidden" name="groupUid" value={groupUid} />

        {/* Posted so a browser without JavaScript keeps the picture it has:
            an omitted uid is what takes one away. */}
        {kept ? <input type="hidden" name="photoUid" value={kept} /> : null}

        <TextField
          label="Group name"
          name="name"
          required
          autoComplete="off"
          maxLength={GROUP_NAME_MAX_LENGTH}
          value={fields.name}
          onChange={(event) => {
            setEdited(true);
            setFields({ ...fields, name: event.target.value });
          }}
          onBlur={() => setTouched(true)}
          error={nameShown}
        />

        <TextArea
          label="Description"
          name="description"
          rows={3}
          maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
          placeholder="What this group is for, if it needs saying"
          hint="Optional."
          value={fields.description ?? ""}
          onChange={(event) => {
            setEdited(true);
            setFields({ ...fields, description: event.target.value });
          }}
          error={errors.description ?? refused?.description}
        />

        <ImagePicker
          label="Group picture"
          preview={image.preview ?? groupPhotoSrc(kept)}
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

        <div className="flex">
          <SubmitButton pendingLabel="Saving…" busy={image.busy}>
            Save changes
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
