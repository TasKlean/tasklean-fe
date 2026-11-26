/**
 * Which room or kind of work a task belongs to, as pills. One at most, and
 * none is a real choice, so the household's list is led by it.
 *
 * Each pill wears its category's own colour and icon, deepening rather than
 * filling when it is the one picked: the same pill the board's rows and its
 * filter draw.
 *
 * Real radios under the paint, controlled, because React resets an
 * uncontrolled form once its action answers.
 */

"use client";

import { LabelMark } from "@/components/app/group/board/label-mark/label-mark";
import {
  CHOICE,
  CHOICE_LABEL,
  CHOICE_OFF,
  CHOICE_ON,
} from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { labelTint } from "@/components/common/label-tint/label-tint";
import type { LabelChoice } from "@/lib/tasks/filter/filter.types";

type CategoryPillsProps = {
  categories: readonly LabelChoice[];
  value: string;
  onPick: (categoryId: string) => void;
};

/** Renders the categories a task can be filed under. */
export function CategoryPills({ categories, value, onPick }: Readonly<CategoryPillsProps>) {
  return (
    <div className="gap-space-xs flex flex-wrap">
      <label className={`${CHOICE} ${value === "" ? CHOICE_ON : CHOICE_OFF}`}>
        <input
          type="radio"
          name="categoryId"
          value=""
          checked={value === ""}
          onChange={() => onPick("")}
          className="sr-only"
        />
        No category
      </label>

      {categories.map((category) => {
        const id = String(category.id);
        const on = value === id;

        return (
          <label
            key={category.id}
            style={labelTint(category.color)}
            className={`${CHOICE} ${CHOICE_LABEL}`}
          >
            <input
              type="radio"
              name="categoryId"
              value={id}
              checked={on}
              onChange={() => onPick(id)}
              className="sr-only"
            />
            <LabelMark color={category.color} icon={category.icon} />
            <span className="ml-1">{category.name}</span>
          </label>
        );
      })}
    </div>
  );
}
