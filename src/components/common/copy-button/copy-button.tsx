/**
 * Copies a value and says whether it worked. One implementation, because the
 * clipboard can be missing or refused and every caller has to survive that the
 * same way.
 */

"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyButtonProps = {
  value: string;
  // The resting label, which is also what names the button to a screen reader.
  label: string;
};

// How long the outcome stays before the button offers itself again.
const SETTLE_MS = 4000;

// What the button says once it knows. Absent means it has not been pressed.
const OUTCOME_LABELS = { copied: "Copied", refused: "Could not copy" } as const;

/** Renders a copy button that reports its own outcome. */
export function CopyButton({ value, label }: Readonly<CopyButtonProps>) {
  const [outcome, setOutcome] = useState<"copied" | "refused" | null>(null);

  async function copy() {
    try {
      // Absent outside a secure context, which throws here rather than rejects.
      await navigator.clipboard.writeText(value);
      setOutcome("copied");
    } catch {
      setOutcome("refused");
    }
    setTimeout(() => setOutcome(null), SETTLE_MS);
  }

  return (
    <button
      type="button"
      onClick={copy}
      // The swapped label is the only sign anything happened, so it is read out.
      aria-live="polite"
      className="text-label-md gap-space-xs px-space-md border-border/60 text-foreground hover:bg-muted flex min-h-11 items-center rounded-full border transition-colors"
    >
      {outcome === "copied" ? (
        <Check className="size-4 shrink-0" aria-hidden />
      ) : (
        <Copy className="size-4 shrink-0" aria-hidden />
      )}
      {outcome ? OUTCOME_LABELS[outcome] : label}
    </button>
  );
}
