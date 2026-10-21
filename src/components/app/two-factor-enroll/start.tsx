/**
 * The first step. The password is asked for here because the backend
 * re-authenticates before it hands over a secret, and only then.
 */

import type { SetupState } from "@/app/(app)/app/settings/two-factor/actions/actions.types";
import { LEAD, STEP } from "@/components/app/two-factor-enroll/two-factor-enroll.styles";
import { FormNotice } from "@/components/common/form-notice";
import { PasswordField } from "@/components/common/password-field";
import { SubmitButton } from "@/components/common/submit-button";

type StartProps = {
  state: SetupState;
  action: (formData: FormData) => void;
  passwordSet: boolean;
  password: string;
  onPassword: (value: string) => void;
};

/** Renders the first step: what this needs, and the password that starts it. */
export function Start({ state, action, passwordSet, password, onPassword }: Readonly<StartProps>) {
  return (
    <>
      <div className="gap-space-xs flex flex-col">
        <h3 className="text-title-md text-foreground">Turn on two-factor</h3>
        <p className={LEAD}>
          {passwordSet
            ? "You will need an authenticator app on your phone. Confirm your password to start."
            : "You will need an authenticator app on your phone. Nothing changes until you confirm a code from it."}
        </p>
      </div>

      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      <form action={action} className={STEP} noValidate>
        {passwordSet ? (
          <PasswordField
            label="Your password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password to continue"
            value={password}
            onChange={(event) => onPassword(event.target.value)}
            error={state.fieldErrors?.password}
          />
        ) : null}

        <SubmitButton pendingLabel="Starting…" disabled={passwordSet && password === ""}>
          Start setting up
        </SubmitButton>
      </form>
    </>
  );
}
