/**
 * What an update moved, a line per field, under the line that says it happened.
 * A field whose values the backend withheld reads as having changed and nothing
 * more, which is most of them: only a safe value is kept.
 */

import type { AuditFieldChange } from "@/lib/audit/audit.types";
import { changePhrases } from "@/lib/audit/changes/changes";

type ChangedFieldsProps = {
  changes: AuditFieldChange[] | undefined;
  // The zone a date value is drawn in, which is the reader's own.
  timeZone?: string;
};

/** Renders the fields an entry changed, or nothing where it changed none. */
export function ChangedFields({ changes, timeZone }: Readonly<ChangedFieldsProps>) {
  const phrases = changePhrases(changes, timeZone);
  if (phrases.length === 0) return null;

  return (
    <ul className="border-border/60 pl-space-md ml-space-xs gap-space-xs flex flex-col border-l">
      {phrases.map((phrase) => (
        <li key={phrase} className="text-label-md text-muted-foreground break-words">
          {phrase}
        </li>
      ))}
    </ul>
  );
}
