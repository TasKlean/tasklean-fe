/**
 * The device's name and the way to change it. Idle, the name and its pencil are
 * one button, so either one opens the editor; a save closes it whichever way it
 * went, because the row renders the name the page read, not the draft.
 */

"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import {
  type RenameDeviceState,
  renameDeviceAction,
} from "@/app/(app)/app/settings/devices/actions/actions";
import { BUTTON, SPINNER } from "@/components/app/device-row/device-row.styles";

type DeviceNameProps = {
  id: number;
  label: string;
  // The opacity a dead session's description carries, or an empty string.
  dim: string;
};

const INITIAL: RenameDeviceState = { error: null };

const PILL = "text-label-sm px-space-sm gap-space-xs inline-flex items-center rounded-full py-1";

const FIELD =
  "bg-card border-input text-body-md text-foreground focus-visible:ring-ring px-space-sm min-h-11 min-w-0 flex-1 rounded-md border focus-visible:ring-2 focus-visible:outline-none";

/** Renders the device's name, the editor behind it, and how a save went. */
export function DeviceName({ id, label, dim }: Readonly<DeviceNameProps>) {
  const [state, rename, saving] = useActionState(renameDeviceAction, INITIAL);
  const [openedWith, setOpenedWith] = useState<RenameDeviceState | null>(null);
  const [draft, setDraft] = useState(label);

  // Open only while the state it opened with is still the current one: a save
  // answers with a fresh object, which closes the editor without an effect.
  const editing = openedWith === state;

  if (editing) {
    return (
      <form
        action={rename}
        // A press anywhere else aborts: focus leaves the form, and relatedTarget
        // is null for a click on something that cannot take focus.
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpenedWith(null);
        }}
        className="gap-space-xs flex min-w-0 flex-wrap items-center"
      >
        <input type="hidden" name="deviceId" value={id} />

        <input
          name="name"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpenedWith(null);
          }}
          // The editor opens on a press, so the field is what the press asked for.
          autoFocus
          aria-label="Device name"
          className={FIELD}
        />

        {/* mousedown is cancelled: Safari does not focus a button on press, so
            the field would blur and abort the edit before the click landed. */}
        <button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          onMouseDown={(event) => event.preventDefault()}
          className={`${BUTTON} bg-primary text-primary-foreground hover:bg-primary-strong shrink-0 border-transparent`}
        >
          {saving ? <Loader2 className={SPINNER} aria-hidden /> : null}
          {saving ? "Saving" : "Save"}
        </button>
      </form>
    );
  }

  return (
    <div className="gap-space-sm flex min-w-0 flex-wrap items-center">
      <button
        type="button"
        onClick={() => {
          setDraft(label);
          setOpenedWith(state);
        }}
        aria-label={`Rename ${label}`}
        // No horizontal padding: the name has to start exactly where the lines
        // below it do, so the hover box hugs the text instead.
        className={`gap-space-xs hover:bg-muted flex min-h-11 min-w-0 items-center rounded-md text-left transition-colors ${dim}`}
      >
        <span className="text-label-lg text-foreground truncate">{label}</span>
        <Pencil className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </button>

      {state.done === true ? (
        <span role="status" className={`${PILL} bg-success-subtle text-success-subtle-foreground`}>
          <Check className="size-4" aria-hidden />
          Saved
        </span>
      ) : null}

      {state.error !== null ? (
        <span
          role="alert"
          className={`${PILL} bg-destructive-subtle text-destructive-subtle-foreground`}
        >
          {state.error}
        </span>
      ) : null}
    </div>
  );
}
