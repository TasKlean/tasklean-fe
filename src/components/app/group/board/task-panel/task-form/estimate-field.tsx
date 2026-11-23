/**
 * How long a chore takes: the four stretches most of them are and a box for
 * anything else, as one row of five.
 *
 * The stretches are `aria-pressed` buttons rather than radios because the
 * field that posts is one input, either the hidden one carrying a chosen
 * stretch or the box carrying a typed one. Two controls sharing the name would
 * post twice.
 */

"use client";

import {
  ESTIMATE_PRESETS,
  presetLabel,
} from "@/components/app/group/board/task-panel/task-form/task-form.helpers";
import {
  CHOICE,
  CHOICE_OFF,
  CHOICE_ON,
  CUSTOM_BOX,
} from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { TASK_MINUTES_MAX } from "@/lib/validation/rules/rules";

type EstimateFieldProps = {
  value: string;
  custom: boolean;
  onPick: (minutes: string) => void;
  onType: (minutes: string) => void;
};

const DIGITS = String(TASK_MINUTES_MAX).length;

/** Renders the stretches on offer and the box that takes anything else. */
export function EstimateField({ value, custom, onPick, onType }: Readonly<EstimateFieldProps>) {
  return (
    <>
      <div role="group" aria-label="Estimated time" className="gap-space-xs grid grid-cols-5">
        {ESTIMATE_PRESETS.map((preset) => {
          const on = !custom && value === String(preset);

          return (
            <button
              key={preset}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(on ? "" : String(preset))}
              className={`${CHOICE} ${on ? CHOICE_ON : CHOICE_OFF}`}
            >
              {presetLabel(preset)}
            </button>
          );
        })}

        {/* Text rather than a number, whose spinners would take half the pill. */}
        <input
          type="text"
          inputMode="numeric"
          aria-label="Custom minutes"
          name={custom ? "estimatedTimeMinutes" : undefined}
          maxLength={DIGITS}
          placeholder="Custom"
          value={custom ? value : ""}
          onChange={(event) => onType(event.target.value)}
          className={`${CUSTOM_BOX} ${custom ? CHOICE_ON : CHOICE_OFF}`}
        />
      </div>

      {custom ? null : <input type="hidden" name="estimatedTimeMinutes" value={value} />}
    </>
  );
}
