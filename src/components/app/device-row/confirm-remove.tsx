/** The question a remove asks in place, rather than in a dialog. */

import { Loader2 } from "lucide-react";
import { BUTTON, QUIET_BUTTON, SPINNER } from "@/components/app/device-row/device-row.styles";

type ConfirmRemoveProps = {
  id: number;
  remove: (formData: FormData) => void;
  removing: boolean;
  busy: boolean;
  onCancel: () => void;
};

/** Renders the question a remove asks before it happens. */
export function ConfirmRemove({
  id,
  remove,
  removing,
  busy,
  onCancel,
}: Readonly<ConfirmRemoveProps>) {
  return (
    <>
      <span className="text-label-sm text-muted-foreground px-space-xs">Remove it?</span>

      <form action={remove}>
        <input type="hidden" name="deviceId" value={id} />
        <button
          type="submit"
          disabled={busy}
          aria-busy={removing}
          className={`${BUTTON} bg-destructive-subtle text-destructive-subtle-foreground border-transparent hover:opacity-90`}
        >
          {removing ? <Loader2 className={SPINNER} aria-hidden /> : null}
          {removing ? "Removing" : "Remove"}
        </button>
      </form>

      <button type="button" onClick={onCancel} disabled={busy} className={QUIET_BUTTON}>
        Cancel
      </button>
    </>
  );
}
