/**
 * How a form reports its answer. One component so a success and a failure never
 * drift apart, and so every screen announces them the same way.
 */

import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

type FormNoticeProps = {
  tone: "success" | "error";
  children: ReactNode;
};

const TONES = {
  success: "bg-success-subtle text-success-subtle-foreground",
  error: "bg-destructive-subtle text-destructive-subtle-foreground",
} as const;

/** Renders a form's answer, announced to a screen reader as it appears. */
export function FormNotice({ tone, children }: FormNoticeProps) {
  return (
    <p
      role={tone === "success" ? "status" : "alert"}
      className={`text-body-md p-space-md gap-space-xs flex items-center rounded-md ${TONES[tone]}`}
    >
      {tone === "success" ? <CheckCircle2 className="size-4 shrink-0" aria-hidden /> : null}
      {children}
    </p>
  );
}
