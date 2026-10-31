/** The question a removal asks in place, rather than in a dialog. */

import { Loader2 } from "lucide-react";
import {
  CONFIRM_BUTTON,
  QUIET_BUTTON,
  SPINNER,
} from "@/components/app/member-row/member-row.styles";

type ConfirmRemoveProps = {
  groupUid: string;
  memberUid: string;
  name: string;
  remove: (formData: FormData) => void;
  removing: boolean;
  busy: boolean;
  onCancel: () => void;
};

/** Renders the question a removal asks before it happens. */
export function ConfirmRemove({
  groupUid,
  memberUid,
  name,
  remove,
  removing,
  busy,
  onCancel,
}: Readonly<ConfirmRemoveProps>) {
  return (
    <>
      <span className="text-label-sm text-destructive px-space-xs">
        Remove {name} from this group?
      </span>

      <form action={remove}>
        <input type="hidden" name="groupUid" value={groupUid} />
        <input type="hidden" name="memberUid" value={memberUid} />
        <button type="submit" disabled={busy} aria-busy={removing} className={CONFIRM_BUTTON}>
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
