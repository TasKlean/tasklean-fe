/**
 * What the one panel holds, in two sections: the order first, then everything
 * that narrows the board. Each axis posts a plain form field, so the panel
 * needs no JavaScript beyond the press that opens it and the two dropdowns.
 *
 * The page is deliberately not a field: a new filter starts at the first page.
 *
 * Which fields are open lives here rather than in each one, because the press
 * in the Filter heading sets them all at once.
 */

"use client";

import { useState } from "react";
import { Field } from "@/components/app/group/board/filter-panel/field";
import { LabelMark } from "@/components/app/group/board/label-mark/label-mark";
import { FilterChip } from "@/components/common/filter-chip/filter-chip";
import { InfoTip } from "@/components/common/info-tip/info-tip";
import { FilterSelect } from "@/components/common/filter-select/filter-select";
import type { SelectOption } from "@/components/common/filter-select/filter-select.types";
import {
  appliedAxes,
  PRIORITY_OPTIONS,
  SORT_OPTIONS,
  STATE_OPTIONS,
} from "@/lib/tasks/filter/filter";
import type {
  FilterAxis,
  LabelChoice,
  TaskQuery,
  WhoChoice,
} from "@/lib/tasks/filter/filter.types";

// Every axis but the order, which is a single dropdown and never collapses.
type FieldKey = Exclude<FilterAxis, "sort">;

type FilterFieldsProps = {
  query: TaskQuery;
  members: readonly WhoChoice[];
  categories: readonly LabelChoice[];
  tags: readonly LabelChoice[];
};

// A rule under each name, so Sort and Filter read as two blocks rather than as
// one list with two labels in it.
const SECTION_ROW =
  "gap-space-sm border-border/60 pb-space-xs mb-space-xs flex min-h-9 items-center justify-between border-b";

// The weight is already in the token, so `font-semibold` would be a second
// rule for one property.
const SECTION = "text-label-lg text-foreground";

const ALL_PRESS =
  "text-label-md px-space-xs text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring flex min-h-9 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none";

/**
 * Turns a roster into the rows the assignee dropdown offers.
 *
 * @returns The two answers that name nobody, then a rule, then the reader and
 * everyone else. The reader is one row carrying `me`, never a second row under
 * their own name: `who=me` is what makes a filtered board a link anybody can
 * open as themselves.
 */
function whoOptions(members: readonly WhoChoice[]): SelectOption[] {
  const me = members.find((member) => member.self);
  const others = members.filter((member) => !member.self);

  return [
    { value: "", label: "Anyone" },
    { value: "free", label: "Unassigned" },
    { value: "me", label: me ? `Me (${me.name})` : "Me", divider: true },
    ...others.map((member) => ({
      value: member.memberUid,
      label: member.former ? `${member.name} (left)` : member.name,
    })),
  ];
}

/** Every field at once, which the one press in the heading sets. */
function allFields(open: boolean): Record<FieldKey, boolean> {
  return { who: open, category: open, tag: open, priority: open, status: open, overdue: open };
}

/**
 * Reads the posted value the reader's current `who` stands for.
 *
 * @returns `me` for the reader's own membership as well as for `who=me`: a
 * typed URL may name either, they mean one board, and only one row offers it.
 */
function whoValue(who: TaskQuery["who"], members: readonly WhoChoice[]): string {
  if (who.kind === "anyone") return "";
  if (who.kind !== "member") return who.kind;

  return members.some((member) => member.self && member.memberUid === who.memberUid)
    ? "me"
    : who.memberUid;
}

/** Renders every field the panel posts. */
export function FilterFields({ query, members, categories, tags }: Readonly<FilterFieldsProps>) {
  const applied = appliedAxes(query);
  const [shown, setShown] = useState<Record<FieldKey, boolean>>(() => ({
    who: applied.who,
    category: applied.category,
    tag: applied.tag,
    priority: applied.priority,
    status: applied.status,
    overdue: applied.overdue,
  }));

  const allOpen = Object.values(shown).every(Boolean);

  /** Shows or hides one field, leaving the rest as they are. */
  function toggle(key: FieldKey) {
    setShown((open) => ({ ...open, [key]: !open[key] }));
  }

  return (
    <div className="gap-space-md flex flex-col">
      <section className="flex min-w-0 flex-col">
        <div className={SECTION_ROW}>
          <span className="relative flex min-w-0 items-center gap-1">
            <h2 className={SECTION}>Sort</h2>

            <InfoTip label="Sort" text="The order the chores are listed in." place="right" />
          </span>
        </div>

        <FilterSelect
          label="Sort the board by"
          name="sort"
          options={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
          value={query.sort}
        />
      </section>

      <section className="gap-space-xs flex min-w-0 flex-col">
        <div className={SECTION_ROW}>
          <span className="relative flex min-w-0 items-center gap-1">
            <h2 className={SECTION}>Filter</h2>

            <InfoTip
              label="Filter"
              text="Narrows the board to the chores you want to see."
              place="right"
            />
          </span>

          <button type="button" onClick={() => setShown(allFields(!allOpen))} className={ALL_PRESS}>
            {allOpen ? "Close all" : "Expand all"}
          </button>
        </div>

        <Field legend="Assigned to" layout="block" open={shown.who} onToggle={() => toggle("who")}>
          <FilterSelect
            label="Show chores assigned to"
            name="who"
            options={whoOptions(members)}
            value={whoValue(query.who, members)}
          />
        </Field>

        {categories.length > 0 ? (
          <Field
            legend="Category"
            layout="strip"
            open={shown.category}
            onToggle={() => toggle("category")}
          >
            <FilterChip
              name="category"
              kind="radio"
              value=""
              label="Any"
              defaultChecked={query.categoryId === null}
            />
            {categories.map((category) => (
              <FilterChip
                key={category.id}
                name="category"
                kind="radio"
                value={String(category.id)}
                label={category.name}
                defaultChecked={query.categoryId === category.id}
                tone="label"
                color={category.color}
                mark={<LabelMark color={category.color} icon={category.icon} />}
              />
            ))}
          </Field>
        ) : null}

        {tags.length > 0 ? (
          <Field legend="Tag" layout="strip" open={shown.tag} onToggle={() => toggle("tag")}>
            <FilterChip
              name="tag"
              kind="radio"
              value=""
              label="Any"
              defaultChecked={query.tagId === null}
            />
            {tags.map((tag) => (
              <FilterChip
                key={tag.id}
                name="tag"
                kind="radio"
                value={String(tag.id)}
                label={tag.name}
                defaultChecked={query.tagId === tag.id}
                tone="label"
                color={tag.color}
                mark={<LabelMark color={tag.color} />}
                markOn="checked"
              />
            ))}
          </Field>
        ) : null}

        <Field legend="Priority" open={shown.priority} onToggle={() => toggle("priority")}>
          {PRIORITY_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              name="priority"
              kind="checkbox"
              value={option.value}
              label={option.label}
              defaultChecked={query.priority.includes(option.value)}
            />
          ))}
        </Field>

        <Field legend="Status" open={shown.status} onToggle={() => toggle("status")}>
          {STATE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              name="status"
              kind="checkbox"
              value={option.value}
              label={option.label}
              defaultChecked={query.status.includes(option.value)}
            />
          ))}
        </Field>

        <Field legend="Due" open={shown.overdue} onToggle={() => toggle("overdue")}>
          <FilterChip
            name="overdue"
            kind="checkbox"
            value="1"
            label="Overdue only"
            defaultChecked={query.overdue}
          />
        </Field>
      </section>
    </div>
  );
}
