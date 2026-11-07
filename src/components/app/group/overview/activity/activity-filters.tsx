/**
 * The row that narrows a trail to one kind of thing. Plain links rather than a
 * client control: the filter is the URL, so the server already knows which chip
 * is current and nothing here needs JavaScript.
 */

import { FilterChip } from "@/components/app/group/overview/activity/filter-chip";
import { FILTER_OPTIONS } from "@/lib/audit/filter/filter";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

type ActivityFiltersProps = {
  // The path the chips hang off, without a query of its own.
  path: string;
  filter: AuditFilter;
};

/** Renders the kinds a trail can be narrowed to, with the open one marked. */
export function ActivityFilters({ path, filter }: Readonly<ActivityFiltersProps>) {
  return (
    <nav aria-label="Filter activity" className="gap-space-xs flex flex-wrap">
      <FilterChip href={path} label="All" current={filter.type === null} />

      {FILTER_OPTIONS.map((option) => (
        <FilterChip
          key={option.value}
          // A chip drops any ref alongside it: a ref names one entity, which is
          // a narrower thing than the kind the chip asks for.
          href={`${path}?type=${option.value}`}
          label={option.label}
          current={filter.type === option.value}
        />
      ))}
    </nav>
  );
}
