/**
 * The create-group form. Nothing here reports success, because the action
 * redirects into the new group as soon as it has one.
 */

"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import {
  createGroupAction,
  type CreateGroupState,
} from "@/app/(app)/app/groups/new/actions/actions";
import { FormNotice } from "@/components/common/form-notice";
import { SubmitButton } from "@/components/common/submit-button";
import { TextArea } from "@/components/common/text-area/text-area";
import { TextField } from "@/components/common/text-field/text-field";
import {
  validateGroupDetails,
  type GroupDetailsFields,
} from "@/lib/validation/forms/group-details.schema/group-details.schema";
import { GROUP_DESCRIPTION_MAX_LENGTH, GROUP_NAME_MAX_LENGTH } from "@/lib/validation/rules/rules";

const INITIAL: CreateGroupState = { error: null };

const EMPTY: GroupDetailsFields = { name: "", description: "" };

/** Renders the form that creates a group. */
export function CreateGroupForm() {
  const [state, formAction] = useActionState(createGroupAction, INITIAL);
  const [fields, setFields] = useState<GroupDetailsFields>(state.values ?? EMPTY);
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState(false);
  const [handled, setHandled] = useState<CreateGroupState>(state);

  const errors = validateGroupDetails(fields);

  // Adjusted in render rather than in an effect, the way React prescribes, and
  // only once per answer the action gives.
  if (handled !== state) {
    setHandled(state);
    setEdited(false);
  }

  // An empty name is not a mistake worth flagging until submit, and the
  // backend's own verdict stands until the field it refers to is edited.
  const refused = edited ? undefined : state.fieldErrors;
  const nameShown =
    (submitted || (touched && fields.name !== "") ? errors.name : undefined) ?? refused?.name;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (errors.name || errors.description) event.preventDefault();
  }

  return (
    <div className="gap-space-md flex flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="gap-space-md flex flex-col"
        noValidate
      >
        <TextField
          label="Group name"
          name="name"
          required
          autoComplete="off"
          placeholder="Flat 12"
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

        <SubmitButton pendingLabel="Creating the group…">Create group</SubmitButton>
      </form>
    </div>
  );
}
