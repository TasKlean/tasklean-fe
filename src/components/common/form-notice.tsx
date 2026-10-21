/**
 * How a form reports its answer. One component so a success and a failure never
 * drift apart, and so every screen announces them the same way.
 */

import { CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

type FormNoticeProps = {
  tone: "success" | "info" | "error";
  children: ReactNode;
};

const TONES = {
  success: "bg-success-subtle text-success-subtle-foreground",
  info: "bg-warning-subtle text-warning-subtle-foreground",
  error: "bg-destructive-subtle text-destructive-subtle-foreground",
} as const;

/** Renders a form's answer, announced to a screen reader as it appears. */
export function FormNotice({ tone, children }: Readonly<FormNoticeProps>) {
  const className = `text-body-md p-space-md gap-space-xs flex items-center rounded-md ${TONES[tone]}`;
  const body = (
    <>
      {tone === "success" ? <CheckCircle2 className="size-4 shrink-0" aria-hidden /> : null}
      {tone === "info" ? <Info className="size-4 shrink-0" aria-hidden /> : null}
      {children}
    </>
  );

  // A failure interrupts, so it stays an alert. Everything else is a status,
  // which is what <output> carries natively.
  if (tone === "error") {
    return (
      <p role="alert" className={className}>
        {body}
      </p>
    );
  }

  return <output className={className}>{body}</output>;
}
