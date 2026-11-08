/** The shape a feed is drawn in once its rows are cut into days. */

import type { AuditEntry } from "@/lib/audit/audit.types";

export type AuditDayRow = {
  entry: AuditEntry;
  // Parsed once here rather than in the row, which draws it twice.
  at: Date | null;
};

export type AuditDay = {
  // The local date, which is what a section is keyed and compared on.
  key: string;
  label: string;
  rows: AuditDayRow[];
};
