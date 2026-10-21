/**
 * The step that proves the app works, which is the only one that turns
 * anything on. It serves a fresh secret and a resumed setup alike, because the
 * code is entered the same way either way.
 */

import { RotateCcw } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { SetupState } from "@/app/(app)/app/settings/two-factor/actions/actions.types";
import { Enrollment } from "@/components/app/two-factor-enroll/enrollment";
import { Resume } from "@/components/app/two-factor-enroll/resume";
import { STEP } from "@/components/app/two-factor-enroll/two-factor-enroll.styles";
import { CodeInput } from "@/components/common/code-input/code-input";
import { FormNotice } from "@/components/common/form-notice";
import { SubmitButton } from "@/components/common/submit-button";

type ConfirmStepProps = {
  // Absent when a pending setup is being resumed, where the app already holds
  // the secret and there is nothing new to show.
  enrollment?: SetupState["enrollment"];
  resuming: boolean;
  error: string | null;
  action: (formData: FormData) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  code: string;
  onCode: Dispatch<SetStateAction<string>>;
  codeError?: string;
  onRestart: () => void;
};

const RESTART_BUTTON =
  "text-label-md gap-space-xs text-muted-foreground hover:text-foreground flex min-h-11 items-center self-start transition-colors";

/** Renders the secret or the resume notice, and the code that confirms it. */
export function ConfirmStep({
  enrollment,
  resuming,
  error,
  action,
  onSubmit,
  code,
  onCode,
  codeError,
  onRestart,
}: Readonly<ConfirmStepProps>) {
  return (
    <>
      {enrollment ? <Enrollment enrollment={enrollment} /> : <Resume />}

      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

      <form action={action} onSubmit={onSubmit} className={STEP} noValidate>
        <CodeInput
          name="code"
          label="The code from your app"
          value={code}
          onChange={onCode}
          error={codeError}
        />

        <FormNotice tone="info">
          Confirming turns two-factor on, signs your other devices out, and shows your recovery
          codes. That is the only time they are shown.
        </FormNotice>

        <SubmitButton pendingLabel="Turning it on…">Turn on two-factor</SubmitButton>
      </form>

      {/* Starting again replaces the pending secret, so the old entry in the
          app stops working. */}
      {resuming ? (
        <button type="button" onClick={onRestart} className={RESTART_BUTTON}>
          <RotateCcw className="size-4 shrink-0" aria-hidden />
          Start again with a new QR code
        </button>
      ) : null}
    </>
  );
}
