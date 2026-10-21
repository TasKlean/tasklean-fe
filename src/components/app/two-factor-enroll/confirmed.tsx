/**
 * The last step, which is the only place the recovery codes ever exist. It
 * renders the empty case too, since a response without them is still a success.
 */

import { RecoveryCodes } from "@/components/app/recovery-codes/recovery-codes";
import { LEAD } from "@/components/app/two-factor-enroll/two-factor-enroll.styles";
import { FormNotice } from "@/components/common/form-notice";

type ConfirmedProps = {
  codes: string[];
  doneHref: string;
  onDone: () => void;
};

/** Renders the codes the factor just produced, which are shown this once. */
export function Confirmed({ codes, doneHref, onDone }: Readonly<ConfirmedProps>) {
  return (
    <>
      <FormNotice tone="success">
        Two-factor is on. Signing in asks for a code from now on, and every other device has been
        signed out.
      </FormNotice>

      {codes.length > 0 ? (
        <>
          <div className="gap-space-xs flex flex-col">
            <h3 className="text-title-md text-foreground">Save your recovery codes</h3>
            <p className={LEAD}>
              Each one works once, and they are the only way in if you lose your phone. This is the
              one time they are shown.
            </p>
          </div>

          <RecoveryCodes codes={codes} doneHref={doneHref} onDone={onDone} />
        </>
      ) : (
        <p className={LEAD}>
          No recovery codes came back, so there are none to save. Reload this page to see what your
          account has.
        </p>
      )}
    </>
  );
}
