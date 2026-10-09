/**
 * The primary form submit button. Reads `useFormStatus`, so it must render
 * inside the form it submits.
 */

"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: ReactNode;
  // Replaces the label while the action is in flight.
  pendingLabel: string;
};

/** Renders a full-width pill submit button that shows progress while pending. */
export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      // Disabling also stops a double submit, which on register would spend two
      // of the five attempts allowed per hour.
      disabled={pending}
      aria-busy={pending}
      className="bg-primary text-primary-foreground hover:bg-primary-strong shadow-level-1 text-label-lg focus-visible:ring-ring group flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-6 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>{pendingLabel}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden
          />
        </>
      )}
    </button>
  );
}
