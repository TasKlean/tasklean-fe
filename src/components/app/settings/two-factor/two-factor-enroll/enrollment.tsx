/**
 * The second step: what an authenticator app needs. The secret is offered to
 * type as well as to scan, because a phone cannot photograph its own screen.
 */

import { Smartphone } from "lucide-react";
import type { SetupState } from "@/app/(app)/app/settings/two-factor/actions/actions.types";
import { LEAD } from "@/components/app/settings/two-factor/two-factor-enroll/two-factor-enroll.styles";
import { CopyButton } from "@/components/common/copy-button/copy-button";
import { QrImage } from "@/components/common/qr-image/qr-image";

type EnrollmentProps = {
  enrollment: NonNullable<SetupState["enrollment"]>;
};

/** Renders what an authenticator app needs: the code to scan, or the key to type. */
export function Enrollment({ enrollment }: Readonly<EnrollmentProps>) {
  return (
    <>
      <div className="gap-space-xs flex flex-col">
        <h3 className="text-title-md text-foreground">Add TasKlean to your app</h3>
        <p className={LEAD}>
          Scan this with an authenticator app, then enter the code it shows. On this phone, open it
          in the app instead.
        </p>
      </div>

      <div className="gap-space-md flex flex-col sm:flex-row sm:items-start">
        <QrImage code={enrollment.qr} label="Scan this with your authenticator app" />

        <div className="gap-space-sm flex min-w-0 flex-col">
          <p className={LEAD}>Cannot scan it? Enter this key by hand.</p>

          <p className="text-body-md text-foreground font-mono break-all">{enrollment.secret}</p>

          <div className="gap-space-xs flex flex-wrap items-center">
            <CopyButton value={enrollment.secret} label="Copy key" />

            <a
              href={enrollment.otpauthUri}
              className="text-label-md gap-space-xs px-space-md border-border/60 text-foreground hover:bg-muted flex min-h-11 items-center rounded-full border transition-colors"
            >
              <Smartphone className="size-4 shrink-0" aria-hidden />
              Open in app
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
