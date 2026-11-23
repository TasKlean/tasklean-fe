/**
 * The one row of controls over the board. The URL is the authority for the
 * filter and a cookie for the layout, so the server decides both.
 *
 * Two shapes, one tree. On a phone it is a two-column grid: the search takes
 * the top row, the layout and the filter the corners of the one under it.
 * From `sm` it is a single flex row, the layout on the left and the search
 * and the filter on the right. Nothing here narrows or orders anything.
 */

import { FilterPanel } from "@/components/app/group/board/filter-panel/filter-panel";
import { TaskSearch } from "@/components/app/group/board/task-search/task-search";
import { ViewPicker } from "@/components/app/group/board/view-picker/view-picker";
import type { LabelChoice, TaskQuery, WhoChoice } from "@/lib/tasks/filter/filter.types";
import type { BoardView } from "@/lib/tasks/view/view.types";

type BoardBarProps = {
  path: string;
  query: TaskQuery;
  view: BoardView;
  members: readonly WhoChoice[];
  categories: readonly LabelChoice[];
  tags: readonly LabelChoice[];
};

/** Renders the layout control, the search and the filter press. */
export function BoardBar({
  path,
  query,
  view,
  members,
  categories,
  tags,
}: Readonly<BoardBarProps>) {
  return (
    // The grid's placement classes do nothing once it is a flex row, so the
    // phone's corners are written once and need no `sm:` undoing.
    <div className="gap-space-sm border-border/60 pb-space-md grid grid-cols-2 items-center border-b sm:flex sm:flex-row sm:items-center">
      <div className="col-start-1 row-start-2">
        <ViewPicker view={view} />
      </div>

      {/* The whole top row on a phone, and what pushes the right-hand end of
          the single row away from the picker. */}
      <div className="col-span-2 row-start-1 sm:ml-auto">
        <TaskSearch path={path} query={query} />
      </div>

      <div className="col-start-2 row-start-2 justify-self-end">
        <FilterPanel
          path={path}
          query={query}
          members={members}
          categories={categories}
          tags={tags}
        />
      </div>
    </div>
  );
}
