/**
 * The form a category is added and saved with, which is one form in two modes:
 * handed a category it saves that one, handed none it adds another.
 *
 * Every field is posted on every save, because `PUT /api/categories/{id}`
 * replaces the category: a colour the reader never touched still has to ride
 * along, or it is cleared.
 */

"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryFormState,
} from "@/app/(app)/app/groups/[uid]/labels/actions/actions";
import { ColorPicker } from "@/components/app/group/labels/color-picker/color-picker";
import { IconPicker } from "@/components/app/group/labels/icon-picker/icon-picker";
import {
  FORM_CONTROLS,
  FORM_NAME,
  FORM_PRESSES,
  PRIMARY_BUTTON,
  QUIET_BUTTON,
  SPINNER,
} from "@/components/app/group/labels/labels.styles";
import { FormNotice } from "@/components/common/form-notice";
import { TextField } from "@/components/common/text-field/text-field";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import {
  validateCategory,
  type CategoryValues,
} from "@/lib/validation/forms/category.schema/category.schema";
import { LABEL_NAME_MAX_LENGTH } from "@/lib/validation/rules/rules";

type CategoryFormProps = {
  groupUid: string;
  // The category being saved, or nothing at all for the form that adds one.
  category?: { id: number } & CategoryValues;
  // Closes the editor a row opened. The add form stays where it is.
  onSaved?: () => void;
  onCancel?: () => void;
};

const INITIAL: CategoryFormState = { error: null, saved: false };

const EMPTY: CategoryValues = { name: "", color: DEFAULT_SWATCH, icon: "" };

/** Renders the fields a category is added or saved with. */
export function CategoryForm({
  groupUid,
  category,
  onSaved,
  onCancel,
}: Readonly<CategoryFormProps>) {
  const [state, formAction, pending] = useActionState(
    category ? updateCategoryAction : createCategoryAction,
    INITIAL,
  );
  const [fields, setFields] = useState<CategoryValues>(category ?? state.values ?? EMPTY);
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [edited, setEdited] = useState(false);
  const [handled, setHandled] = useState<CategoryFormState>(state);

  const errors = validateCategory(fields);
  const fieldId = category ? `category-${category.id}-name` : "new-category-name";

  // Adjusted in render rather than in an effect, the way React prescribes, and
  // only once per answer the action gives.
  if (handled !== state) {
    setHandled(state);
    setEdited(false);
    setSubmitted(false);
    setTouched(false);
    // The add form empties itself, where an editor is closed by its row.
    if (state.saved && !category) setFields(EMPTY);
  }

  // The one thing render cannot do: a saved editor is closed by its parent, and
  // a child may not set another component's state while rendering.
  useEffect(() => {
    if (state.saved) onSaved?.();
  }, [state.saved, onSaved]);

  const refused = edited ? undefined : state.fieldErrors;
  const nameShown =
    (submitted || (touched && fields.name !== "") ? errors.name : undefined) ?? refused?.name;

  const change = useCallback((patch: Partial<CategoryValues>) => {
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
      // controlled value it did not change: the two pickers are both radios.
      onReset={(event) => event.preventDefault()}
      className="gap-space-md flex flex-col"
      noValidate
    >
      <input type="hidden" name="groupUid" value={groupUid} />
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      <div className={FORM_NAME}>
        <TextField
          id={fieldId}
          label="Name"
          name="name"
          required
          autoComplete="off"
          placeholder="Kitchen"
          maxLength={LABEL_NAME_MAX_LENGTH}
          value={fields.name}
          onChange={(event) => change({ name: event.target.value })}
          onBlur={() => setTouched(true)}
          error={nameShown}
        />
      </div>

      <div className={FORM_CONTROLS}>
        <ColorPicker value={fields.color} onChange={(color) => change({ color })} />

        <IconPicker value={fields.icon} onChange={(icon) => change({ icon })} />

        <div className={FORM_PRESSES}>
          <button type="submit" disabled={pending} aria-busy={pending} className={PRIMARY_BUTTON}>
            {pending ? <Loader2 className={SPINNER} aria-hidden /> : null}
            {category ? "Save" : "Add category"}
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
