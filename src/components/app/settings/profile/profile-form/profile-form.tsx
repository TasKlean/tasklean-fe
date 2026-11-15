/**
 * Your own name and picture, edited in place. A save reseals the session, so
 * the header's greeting and avatar follow the same press.
 *
 * The picture is a file, and a save is a full replace: `PUT /api/users/{uid}`
 * takes the profile as it will then be, so leaving `photoUid` out is how a
 * picture is removed and a save that keeps one has to post the uid the account
 * already holds. That is why the submit is intercepted: the bytes have to reach
 * the bucket and come back as a uid before the form can be sent at all.
 */

"use client";

import type { FormEvent } from "react";
import { startTransition, useActionState, useState } from "react";
import {
  updateProfileAction,
  type ProfileState,
} from "@/app/(app)/app/settings/profile/actions/actions";
import { FormNotice } from "@/components/common/form-notice";
import { ImagePicker } from "@/components/common/image-picker/image-picker";
import { SubmitButton } from "@/components/common/submit-button";
import { TextField } from "@/components/common/text-field/text-field";
import { useImageUpload } from "@/hooks/use-image-upload/use-image-upload";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";
import {
  validateEditProfile,
  type EditProfileValues,
} from "@/lib/validation/forms/edit-profile.schema/edit-profile.schema";
import { NAME_MAX_LENGTH } from "@/lib/validation/rules/rules";

type ProfileFormProps = {
  // The reader's own user uid, which is what an avatar upload is signed for.
  // A group's uid here is a 403 before anything is signed.
  userUid: string;
  name: string;
  middleName: string;
  lastName: string;
  // The picture the account holds now, which a save has to carry again unless
  // it is being replaced or taken away.
  photoUid: string | null;
};

const INITIAL: ProfileState = { error: null, saved: false };

/** Renders the form that changes your name and picture. */
export function ProfileForm({
  userUid,
  name,
  middleName,
  lastName,
  photoUid,
}: Readonly<ProfileFormProps>) {
  // `saving` is read rather than left to `useFormStatus`: the dispatch below
  // happens after an await, so the submit event it would be attributed to is gone.
  const [state, formAction, saving] = useActionState(updateProfileAction, INITIAL);
  const [fields, setFields] = useState<EditProfileValues>(
    state.values ?? { name, middleName, lastName },
  );
  const [touched, setTouched] = useState<Partial<Record<keyof EditProfileValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [handled, setHandled] = useState<ProfileState>(state);
  const image = useImageUpload({ purpose: "USER_PHOTO", targetUid: userUid });

  const errors = validateEditProfile(fields);
  const kept = removed ? null : photoUid;

  // Adjusted in render rather than in an effect, the way React prescribes, and
  // only once per answer the action gives.
  if (handled !== state) {
    setHandled(state);
    setEdited(false);
  }

  const refused = edited ? undefined : state.fieldErrors;

  /** Picks the message a field shows, if any, from the three that compete. */
  function shown(field: keyof EditProfileValues): string | undefined {
    const visible = submitted || (touched[field] && fields[field] !== "");
    return (visible ? errors[field] : undefined) ?? refused?.[field];
  }

  /** Records a keystroke, which also lets the backend's own complaint go. */
  function set(field: keyof EditProfileValues) {
    return (event: { target: { value: string } }) => {
      setEdited(true);
      setFields((was) => ({ ...was, [field]: event.target.value }));
    };
  }

  /** Marks a field as left, which is when its own complaint may show. */
  function touch(field: keyof EditProfileValues) {
    return () => setTouched((was) => ({ ...was, [field]: true }));
  }

  /** Sends the staged picture, then the form, since the uid is what it posts. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Always: the save cannot start until the bytes are in the bucket, so the
    // form is dispatched by hand further down rather than by the browser.
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSubmitted(true);
    if (errors.name || errors.middleName || errors.lastName) return;

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
    <div className="gap-space-md flex flex-col">
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}
      {state.saved && !edited ? <FormNotice tone="success">Profile saved.</FormNotice> : null}

      <form onSubmit={handleSubmit} className="gap-space-md flex flex-col" noValidate>
        {/* Posted so a browser without JavaScript keeps the picture it has:
            an omitted uid is what takes one away. */}
        {kept ? <input type="hidden" name="photoUid" value={kept} /> : null}

        <div className="gap-space-md grid grid-cols-1 sm:grid-cols-2">
          <TextField
            label="First name"
            name="name"
            required
            autoComplete="given-name"
            maxLength={NAME_MAX_LENGTH}
            value={fields.name}
            onChange={set("name")}
            onBlur={touch("name")}
            error={shown("name")}
          />
          <TextField
            label="Last name"
            name="lastName"
            required
            autoComplete="family-name"
            maxLength={NAME_MAX_LENGTH}
            value={fields.lastName}
            onChange={set("lastName")}
            onBlur={touch("lastName")}
            error={shown("lastName")}
          />
        </div>

        <TextField
          label="Middle name"
          name="middleName"
          autoComplete="additional-name"
          maxLength={NAME_MAX_LENGTH}
          hint="Optional."
          value={fields.middleName ?? ""}
          onChange={set("middleName")}
          onBlur={touch("middleName")}
          error={shown("middleName")}
        />

        <ImagePicker
          label="Profile picture"
          shape="circle"
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

        <div className="flex">
          {/* Both halves: the picker reports the upload and the action reports
              the save, and the press covers them with no gap between. */}
          <SubmitButton pendingLabel="Saving…" busy={image.busy || saving}>
            Save changes
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
