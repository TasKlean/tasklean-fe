/**
 * How urgent a task is, as one pill moving along a track of three, and none
 * of them where nobody said. A radio cannot be unticked, so the press on the
 * one already on is what clears it, rather than a fourth pill for nothing.
 *
 * Real radios under the paint, controlled, because React resets an
 * uncontrolled form once its action answers.
 */

"use client";

import { PRIORITY_TONE } from "@/components/app/group/board/board.styles";
import {
  SEGMENT,
  SEGMENT_OFF,
  TRACK,
} from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { PRIORITY_OPTIONS } from "@/lib/tasks/filter/filter";
import { PRIORITY_FOR_TOKEN } from "@/lib/tasks/filter/filter.types";

type PriorityPillsProps = {
  value: string;
  onPick: (priority: string) => void;
};

// A track runs from least to most urgent, where the filter menu leads with
// High, the one a reader goes looking for.
const TRACK_ORDER = PRIORITY_OPTIONS.toReversed();

/** Renders the three priorities a task can carry. */
export function PriorityPills({ value, onPick }: Readonly<PriorityPillsProps>) {
  return (
    <div className={TRACK}>
      {TRACK_ORDER.map((option) => {
        const priority = PRIORITY_FOR_TOKEN[option.value];
        const on = value === priority;

        return (
          // The chosen one wears the colour the task's own pill will, rather
          // than the brand fill, so the form shows what the board will say.
          <label
            key={priority}
            className={`${SEGMENT} ${on ? PRIORITY_TONE[priority] : SEGMENT_OFF}`}
          >
            <input
              type="radio"
              name="priority"
              value={priority}
              checked={on}
              onChange={() => onPick(priority)}
              // A press on the one already ticked fires no change, the value
              // not having moved, so the clearing hangs off the click.
              onClick={() => {
                if (on) onPick("");
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
