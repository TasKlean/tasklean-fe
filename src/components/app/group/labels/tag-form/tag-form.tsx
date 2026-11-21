/**
 * The form a tag is added and saved with. Same two modes as a category, with
 * one more: a member may change a tag's colour but not its name, so for them
 * the name becomes a hidden field carrying exactly what is stored.
 *
 * That is not a guess about the backend. `PUT /api/tags/{id}` takes the whole
 * tag and refuses the body, not the call, when a non-admin sent a different
 * name, and it compares the stored spelling exactly: changing only the case is
 * still a rename.
 */

"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createTagAction,
  updateTagAction,
  type TagFormState,
} from "@/app/(app)/app/groups/[uid]/labels/actions/actions";
import { ColorPicker } from "@/components/app/group/labels/color-picker/color-picker";
import {
  FORM_CONTROLS,
  FORM_NAME,
  FORM_PRESSES,
  PRIMARY_BUTTON,
  QUIET_BUTTON,
  SPINNER,
} from "@/components/app/group/labels/labels.styles";
import { FormNotice } from "@/components/common/form-notice";
import { LabelChip } from "@/components/common/label-chip/label-chip";
import { TextField } from "@/components/common/text-field/text-field";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import { validateTag, type TagValues } from "@/lib/validation/forms/tag.schema/tag.schema";
import { LABEL_NAME_MAX_LENGTH } from "@/lib/validation/rules/rules";

type TagFormProps = {
  groupUid: string;
  // The tag being saved, or nothing at all for the form that adds one.
  tag?: { id: number } & TagValues;
  // False for a member editing an existing tag, which is the one case where the
  // name is posted back rather than offered.
  canRename?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
};

const INITIAL: TagFormState = { error: null, saved: false };

const EMPTY: TagValues = { name: "", color: DEFAULT_SWATCH };

/** Renders the fields a tag is added or saved with. */
export function TagForm({
  groupUid,
  tag,
  canRename = true,
  onSaved,
  onCancel,
}: Readonly<TagFormProps>) {
  const [state, formAction, pending] = useActionState(
    tag ? updateTagAction : createTagAction,
    INITIAL,
  );
  const [fields, setFields] = useState<TagValues>(tag ?? state.values ?? EMPTY);
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState(false);
  const [handled, setHandled] = useState<TagFormState>(state);

  const errors = validateTag(fields);
  const named = tag ? canRename : true;
  const fieldId = tag ? `tag-${tag.id}-name` : "new-tag-name";

  // Adjusted in render rather than in an effect, the way React prescribes, and
  // only once per answer the action gives.
  if (handled !== state) {
    setHandled(state);
    setEdited(false);
    setSubmitted(false);
    setTouched(false);
    // The add form empties itself, where an editor is closed by its row.
    if (state.saved && !tag) setFields(EMPTY);
  }

  // The one thing render cannot do: a saved editor is closed by its parent, and
  // a child may not set another component's state while rendering.
  useEffect(() => {
    if (state.saved) onSaved?.();
  }, [state.saved, onSaved]);

  const refused = edited ? undefined : state.fieldErrors;
  const nameShown =
    (submitted || (touched && fields.name !== "") ? errors.name : undefined) ?? refused?.name;

  const change = useCallback((patch: Partial<TagValues>) => {
    setEdited(true);
    setFields((current) => ({ ...current, ...patch }));
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (errors.name || errors.color) event.preventDefault();
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      // React resets the form once the action answers, and never rewrites a
      // controlled value it did not change: the palette is a set of radios.
      onReset={(event) => event.preventDefault()}
      className="gap-space-md flex flex-col"
      noValidate
    >
      <input type="hidden" name="groupUid" value={groupUid} />
      {tag ? <input type="hidden" name="id" value={tag.id} /> : null}

      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {named ? (
        <div className={FORM_NAME}>
          <TextField
            id={fieldId}
            label="Name"
            name="name"
            required
            autoComplete="off"
            placeholder="Urgent"
            maxLength={LABEL_NAME_MAX_LENGTH}
            value={fields.name}
            onChange={(event) => change({ name: event.target.value })}
            onBlur={() => setTouched(true)}
            error={nameShown}
          />
        </div>
      ) : (
        <>
          <input type="hidden" name="name" value={fields.name} />
          {/* The editor replaces the row, so without this nothing on screen
              says which tag is being recoloured. */}
          <LabelChip name={fields.name} color={fields.color} />
        </>
      )}

      <div className={FORM_CONTROLS}>
        <ColorPicker value={fields.color} onChange={(color) => change({ color })} />

        <div className={FORM_PRESSES}>
          <button type="submit" disabled={pending} aria-busy={pending} className={PRIMARY_BUTTON}>
            {pending ? <Loader2 className={SPINNER} aria-hidden /> : null}
            {tag ? "Save" : "Add tag"}
          </button>

          {onCancel ? (
            <button type="button" onClick={onCancel} disabled={pending} className={QUIET_BUTTON}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
