/** One row of the sample list, built from tokens so the mock cannot go stale. */

import { Camera, Check, Repeat2 } from "lucide-react";

type MockTaskProps = {
  title: string;
  who: string;
  note: string;
  done?: boolean;
};

/** Renders one row of the sample task list. */
export function MockTask({ title, who, note, done = false }: Readonly<MockTaskProps>) {
  return (
    <li className="bg-background gap-space-sm p-space-sm flex items-center rounded-md">
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-success text-success-foreground" : "border-border border-2"
        }`}
      >
        {done ? <Check className="size-4" /> : null}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`text-body-md block truncate ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {title}
        </span>
        <span className="text-label-sm text-muted-foreground gap-space-xs flex items-center">
          {who}
          <span>·</span>
          {note === "Photo proof" ? <Camera className="size-3" /> : null}
          {note.startsWith("Every") ? <Repeat2 className="size-3" /> : null}
          {note}
        </span>
      </span>
    </li>
  );
}
