/**
 * What a chore is set to, as marks on its row: how often it comes back and
 * whether it has to be photographed. No pill around either, so the line reads
 * as a note under the name rather than as more labels.
 */

import { Camera, Repeat2 } from "lucide-react";
import { Tooltip } from "@/components/common/tooltip/tooltip";
import { recurrenceLabel } from "@/lib/tasks/recurrence/recurrence";

type TaskMarksProps = {
  // Absent for a chore that happens once, which is most of them.
  recurrence: string | undefined;
  photoProof: boolean;
  // False on a phone, where the icons ride in the row of pills and there is
  // width for nothing else. The words are read out either way.
  words?: boolean;
};

const MARK =
  "text-label-sm text-muted-foreground gap-1 flex shrink-0 items-center whitespace-nowrap";

/** Renders the marks this chore has earned, in order. */
export function TaskMarks({ recurrence, photoProof, words = true }: Readonly<TaskMarksProps>) {
  const marks = [
    ...(recurrence ? [{ Icon: Repeat2, label: recurrenceLabel(recurrence), tip: "Repeats" }] : []),
    ...(photoProof
      ? [{ Icon: Camera, label: "Photo proof", tip: "Photo proof on completion" }]
      : []),
  ];

  return marks.map(({ Icon, label, tip }) => (
    <Tooltip key={label} text={tip}>
      <span className={MARK}>
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="sr-only">{label}</span>
        {words ? <span aria-hidden>{label}</span> : null}
      </span>
    </Tooltip>
  ));
}
