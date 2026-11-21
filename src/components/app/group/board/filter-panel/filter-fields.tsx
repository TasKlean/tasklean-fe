/**
 * What the one panel holds, in two sections: the order first, then everything
 * that narrows the board. Each axis posts a plain form field, so the panel
 * needs no JavaScript beyond the press that opens it and the two dropdowns.
 *
 * The page is deliberately not a field: a new filter starts at the first page.
 */

import type { ReactNode } from "react";
import { FilterChip } from "@/components/common/filter-chip/filter-chip";
import { FilterSelect, type SelectOption } from "@/components/common/filter-select/filter-select";
import { DEFAULT_SWATCH } from "@/lib/labels/palette/palette";
import { PRIORITY_OPTIONS, SORT_OPTIONS, STATE_OPTIONS } from "@/lib/tasks/filter/filter";
import type { TaskQuery } from "@/lib/tasks/filter/filter.types";

type LabelChoice = { id: number; name: string; color?: string };
type WhoChoice = { memberUid: string; name: string; former: boolean };

type FilterFieldsProps = {
  query: TaskQuery;
  members: readonly WhoChoice[];
  categories: readonly LabelChoice[];
  tags: readonly LabelChoice[];
};

const SECTION = "text-label-lg text-foreground font-semibold";

const LEGEND = "text-label-sm text-muted-foreground mb-1.5 font-semibold";

const WRAP = "gap-space-xs flex flex-wrap";

// A strip rather than a wrap: a household with twenty categories would
// otherwise stack five rows deep and push Apply off a phone.
const STRIP = "gap-space-xs scrollbar-slim -mx-1 flex overflow-x-auto px-1 pb-1";

/** A dot in a label's own colour, so a long strip is scannable. */
function Swatch({ color }: Readonly<{ color?: string }>) {
  return (
    <span
      aria-hidden
      style={{ backgroundColor: color ?? DEFAULT_SWATCH }}
      className="size-2.5 shrink-0 rounded-full"
    />
  );
}

/** Renders one axis under its own name. */
function Field({
  legend,
  children,
  strip = false,
}: Readonly<{ legend: string; children: ReactNode; strip?: boolean }>) {
  return (
    // `min-w-0` is load-bearing: a fieldset defaults to `min-width: min-content`
    // and would grow past the panel rather than let a strip scroll. Measured.
    <fieldset className="min-w-0">
      <legend className={LEGEND}>{legend}</legend>
      <div className={strip ? STRIP : WRAP}>{children}</div>
    </fieldset>
  );
}

/** Turns a label list into the rows a dropdown offers. */
function whoOptions(members: readonly WhoChoice[]): SelectOption[] {
  return [
    { value: "", label: "Anyone" },
    { value: "me", label: "Me" },
    { value: "free", label: "Nobody yet" },
    ...members.map((member) => ({
      value: member.memberUid,
      label: member.former ? `${member.name} (left)` : member.name,
    })),
  ];
}

/** Reads the posted value the reader's current `who` stands for. */
function whoValue(who: TaskQuery["who"]): string {
  if (who.kind === "member") return who.memberUid;
  if (who.kind === "anyone") return "";
  return who.kind;
}

/** Renders every field the panel posts. */
export function FilterFields({ query, members, categories, tags }: Readonly<FilterFieldsProps>) {
  return (
    <div className="gap-space-md flex flex-col">
      <section className="gap-space-xs flex min-w-0 flex-col">
        <h2 className={SECTION}>Sort</h2>

        <FilterSelect
          label="Sort the board by"
          name="sort"
          options={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
          value={query.sort}
        />
      </section>

      <section className="gap-space-md flex min-w-0 flex-col">
        <h2 className={SECTION}>Filter</h2>

        <Field legend="Status">
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

        <Field legend="Priority">
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

        <Field legend="Due">
          <FilterChip
            name="overdue"
            kind="checkbox"
            value="1"
            label="Overdue only"
            defaultChecked={query.overdue}
          />
        </Field>

        <div>
          <p className={LEGEND}>Assigned to</p>

          <FilterSelect
            label="Show chores assigned to"
            name="who"
            options={whoOptions(members)}
            value={whoValue(query.who)}
          />
        </div>

        {categories.length > 0 ? (
          <Field legend="Category" strip>
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
                mark={<Swatch color={category.color} />}
              />
            ))}
          </Field>
        ) : null}

        {tags.length > 0 ? (
          <Field legend="Tag" strip>
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
                mark={<Swatch color={tag.color} />}
              />
            ))}
          </Field>
        ) : null}
      </section>
    </div>
  );
}
