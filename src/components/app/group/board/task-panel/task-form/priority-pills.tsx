/**
 * How urgent a chore is, as one pill moving along a track of three, and none
 * of them where nobody said. A radio cannot be unticked, so the press on the
 * one already on is what clears it, rather than a fourth pill for nothing.
 *
 * Real radios under the paint, controlled, because React resets an
 * uncontrolled form once its action answers.
 */

"use client";

import {
  SEGMENT,
  SEGMENT_OFF,
  SEGMENT_ON,
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

/** Renders the three priorities a chore can carry. */
export function PriorityPills({ value, onPick }: Readonly<PriorityPillsProps>) {
  return (
    <div className={TRACK}>
      {TRACK_ORDER.map((option) => {
        const priority = PRIORITY_FOR_TOKEN[option.value];
        const on = value === priority;

        return (
          <label key={priority} className={`${SEGMENT} ${on ? SEGMENT_ON : SEGMENT_OFF}`}>
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
