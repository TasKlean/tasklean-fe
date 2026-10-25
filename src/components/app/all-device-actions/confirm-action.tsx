/** The question either account-wide device action asks before it happens. */

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  CONFIRM_BUTTON,
  QUIET_BUTTON,
  SPINNER,
} from "@/components/app/all-device-actions/all-device-actions.styles";

type ConfirmActionProps = {
  question: string;
  label: string;
  pendingLabel: string;
  icon: ReactNode;
  act: (formData: FormData) => void;
  pending: boolean;
  onCancel: () => void;
};

/** Renders the question, the button that goes through with it, and a way back. */
export function ConfirmAction({
  question,
  label,
  pendingLabel,
  icon,
  act,
  pending,
  onCancel,
}: Readonly<ConfirmActionProps>) {
  return (
    <>
      <p className="text-body-md text-muted-foreground">{question}</p>

      <div className="gap-space-xs flex flex-wrap items-center">
        <form action={act}>
          <button type="submit" disabled={pending} aria-busy={pending} className={CONFIRM_BUTTON}>
            {pending ? <Loader2 className={SPINNER} aria-hidden /> : icon}
            {pending ? pendingLabel : label}
          </button>
        </form>

        <button type="button" onClick={onCancel} disabled={pending} className={QUIET_BUTTON}>
          Cancel
        </button>
      </div>
    </>
  );
}
