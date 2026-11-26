/**
 * When a task is next due: a day, and a time only if it matters.
 *
 * Two fields for one wire value. An empty time means the end of that day, so a
 * task due Tuesday is overdue on Wednesday rather than at Tuesday midnight,
 * and nobody has to type 23:59 to say "sometime Tuesday".
 */

import { FIELD_INFO } from "@/components/app/group/board/task-panel/task-form/task-form.labels";
import { HALVES } from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { TextField } from "@/components/common/text-field/text-field";

type DueFieldsProps = {
  date: string;
  time: string;
  // Today where the reader is, which the picker will not go back past: the
  // endpoint refuses a new due date that has gone by. A stored past date still
  // shows and still posts, the form running its own validation.
  min: string;
  // Carries the repeating-task refusal as well as a malformed date.
  error?: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
};

/** Renders the due day and its optional time, half a row each. */
export function DueFields({ date, time, min, error, onDate, onTime }: Readonly<DueFieldsProps>) {
  return (
    <div className={HALVES}>
      <TextField
        label="Due date"
        name="dueDate"
        info={FIELD_INFO.dueDate}
        type="date"
        min={min}
        value={date}
        onChange={(event) => onDate(event.target.value)}
        error={error}
      />

      <TextField
        label="Due time"
        name="dueTime"
        info={FIELD_INFO.dueTime}
        infoEnd
        type="time"
        value={time}
        onChange={(event) => onTime(event.target.value)}
      />
    </div>
  );
}
