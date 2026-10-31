/**
 * The recovery codes, shown exactly once. The backend keeps only their hashes,
 * so leaving this screen without saving them means a new set is the only way
 * back, never these.
 */

"use client";

import { Download } from "lucide-react";
import type { MouseEvent } from "react";
import { CopyButton } from "@/components/common/copy-button/copy-button";

type RecoveryCodesProps = {
  codes: string[];
  // Where "I have saved them" goes with no JavaScript: a plain load of the
  // page, which re-reads the state the long way round.
  doneHref: string;
  // What it does instead when there is JavaScript. The href alone is a no-op,
  // because it points at the page already on screen.
  onDone: () => void;
};

const FILE_NAME = "tasklean-recovery-codes.txt";

const BUTTON =
  "text-label-md gap-space-xs px-space-md flex min-h-11 items-center rounded-full border transition-colors";

/** Renders the codes, a way to keep them and a way to move on. */
export function RecoveryCodes({ codes, doneHref, onDone }: Readonly<RecoveryCodesProps>) {
  const text = `TasKlean recovery codes\n\nEach code works once, and only on your account.\n\n${codes.join("\n")}\n`;

  function done(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onDone();
  }

  return (
    <div className="gap-space-md flex flex-col">
      <ul className="bg-muted p-space-md gap-space-xs grid grid-cols-2 rounded-md">
        {codes.map((code) => (
          <li key={code} className="text-body-md text-foreground font-mono tracking-wide">
            {code}
          </li>
        ))}
      </ul>

      <div className="gap-space-xs flex flex-wrap items-center">
        <CopyButton value={text} label="Copy codes" />

        {/* A data URI rather than a blob: it needs no handler, so the download
            works before the page is interactive. */}
        <a
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
          download={FILE_NAME}
          className={`${BUTTON} border-border/60 text-foreground hover:bg-muted`}
        >
          <Download className="size-4 shrink-0" aria-hidden />
          Download
        </a>

        <a
          href={doneHref}
          onClick={done}
          className={`${BUTTON} bg-primary text-primary-foreground border-transparent hover:opacity-90`}
        >
          I have saved them
        </a>
      </div>
    </div>
  );
}
