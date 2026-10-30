/**
 * Copying one short string, which either works or does not and says which. The
 * clipboard is absent outside a secure context rather than failing, so the
 * refusal is a state and not an error nobody sees.
 */

"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyButtonProps = {
  value: string;
  // The resting label, which is also what names the button to a screen reader.
  label: string;
  // The icon alone, for a row with no width for the word. The label is still
  // rendered, so the live region has something to read when the outcome lands.
  compact?: boolean;
};

// How long the outcome stays before the button offers itself again.
const SETTLE_MS = 4000;

// What the button says once it knows. Absent means it has not been pressed.
const OUTCOME_LABELS = { copied: "Copied", refused: "Could not copy" } as const;

const BASE = "gap-space-xs flex min-h-11 items-center rounded-full transition-colors";

const SHAPES = {
  full: `${BASE} text-label-md px-space-md border-border/60 text-foreground hover:bg-muted border`,
  compact: `${BASE} text-muted-foreground hover:text-foreground size-11 shrink-0 justify-center`,
} as const;

/** Renders the press that copies a value, and what came of it. */
export function CopyButton({ value, label, compact = false }: Readonly<CopyButtonProps>) {
  const [outcome, setOutcome] = useState<"copied" | "refused" | null>(null);

  /** Copies the value and keeps the outcome around long enough to be read. */
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
      className={compact ? SHAPES.compact : SHAPES.full}
    >
      {outcome === "copied" ? (
        <Check className="size-4 shrink-0" aria-hidden />
      ) : (
        <Copy className="size-4 shrink-0" aria-hidden />
      )}
      <span className={compact ? "sr-only" : ""}>{outcome ? OUTCOME_LABELS[outcome] : label}</span>
    </button>
  );
}
