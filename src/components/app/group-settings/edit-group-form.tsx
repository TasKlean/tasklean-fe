/**
 * A group's name, description and picture, edited in place. The fields start
 * from what the backend answered with and a save re-renders the shell, so the
 * rail's heading and the list's card follow the same press.
 *
 * The picture is a pasted link, since nothing in the product uploads a file,
 * and the avatar beside the field is drawn from what is typed: a URL that will
 * not render is worth seeing before the save rather than after it.
 */

"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import {
  updateGroupDetailsAction,
  type GroupDetailsState,
} from "@/app/(app)/app/groups/[uid]/settings/actions/actions";
import { GroupAvatar } from "@/components/app/group-avatar/group-avatar";
import { FormNotice } from "@/components/common/form-notice";
import { SubmitButton } from "@/components/common/submit-button";
import { TextArea } from "@/components/common/text-area/text-area";
import { TextField } from "@/components/common/text-field/text-field";
import {
  validateGroupDetails,
  type GroupDetailsFields,
} from "@/lib/validation/forms/group-details.schema/group-details.schema";
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  GROUP_PHOTO_MAX_LENGTH,
} from "@/lib/validation/rules/rules";

type EditGroupFormProps = {
  groupUid: string;
  name: string;
  description: string;
  photoUrl: string;
};

const INITIAL: GroupDetailsState = { error: null, saved: false };

/** Renders the form that changes a group's details. */
export function EditGroupForm({
  groupUid,
  name,
  description,
  photoUrl,
}: Readonly<EditGroupFormProps>) {
  const [state, formAction] = useActionState(updateGroupDetailsAction, INITIAL);
  const [fields, setFields] = useState<GroupDetailsFields>(
    state.values ?? { name, description, photoUrl },
  );
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState(false);
  const [handled, setHandled] = useState<GroupDetailsState>(state);

  const errors = validateGroupDetails(fields);

  // Adjusted in render rather than in an effect, the way React prescribes, and
  // only once per answer the action gives.
  if (handled !== state) {
    setHandled(state);
    setEdited(false);
  }

  const refused = edited ? undefined : state.fieldErrors;
  const nameShown =
    (submitted || (touched && fields.name !== "") ? errors.name : undefined) ?? refused?.name;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (errors.name || errors.description || errors.photoUrl) event.preventDefault();
  }

  return (
    // Bounded, because the group's own column is the width of the window less
    // the rail: a name field and a primary pill 830px wide read as a page, not
    // as one card's control.
    <div className="gap-space-md flex max-w-2xl flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}
      {state.saved && !edited ? <FormNotice tone="success">Group details saved.</FormNotice> : null}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="gap-space-md flex flex-col"
        noValidate
      >
        <input type="hidden" name="groupUid" value={groupUid} />

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

        <div className="gap-space-md flex items-start">
          {/* Decoration: the field beside it is labelled, and an empty or
              unusable link draws the group's letter instead. */}
          <span aria-hidden className="pt-7">
            <GroupAvatar name={fields.name || name} photoUrl={fields.photoUrl} />
          </span>

          <div className="min-w-0 flex-1">
            <TextField
              label="Picture link"
              name="photoUrl"
              type="url"
              inputMode="url"
              autoComplete="off"
              maxLength={GROUP_PHOTO_MAX_LENGTH}
              placeholder="https://example.com/kitchen.jpg"
              hint="Optional. Paste a link to an image."
              value={fields.photoUrl ?? ""}
              onChange={(event) => {
                setEdited(true);
                setFields({ ...fields, photoUrl: event.target.value });
              }}
              error={errors.photoUrl ?? refused?.photoUrl}
            />
          </div>
        </div>

        <div className="flex">
          <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
        </div>
      </form>
    </div>
  );
}
