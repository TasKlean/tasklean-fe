import { LEAD } from "@/components/app/two-factor-enroll/two-factor-enroll.styles";

/** Renders the way back into a setup that was started and never confirmed. */
export function Resume() {
  return (
    <div className="gap-space-xs flex flex-col">
      <h3 className="text-title-md text-foreground">Finish what you started</h3>
      <p className={LEAD}>
        You set this up before without confirming it. If TasKlean is still in your authenticator
        app, enter the code it shows. If it is not, start again for a new QR code.
      </p>
    </div>
  );
}
