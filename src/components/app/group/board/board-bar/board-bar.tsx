/**
 * The one row of controls over the board. The URL is the authority for the
 * filter and a cookie for the layout, so the server decides both.
 *
 * Two shapes. On a phone the search takes the top row and the layout and the
 * filter share the one under it, the layout collapsed into a dropdown; from
 * `sm` it is a single row, the layout as pills on the left and the search and
 * the filter on the right. Nothing here narrows or orders anything.
 */

import { FilterPanel } from "@/components/app/group/board/filter-panel/filter-panel";
import { TaskSearch } from "@/components/app/group/board/task-search/task-search";
import { ViewMenu } from "@/components/app/group/board/view-menu/view-menu";
import { ViewPills } from "@/components/app/group/board/view-pills/view-pills";
import type { TaskQuery } from "@/lib/tasks/filter/filter.types";
import type { BoardView } from "@/lib/tasks/view/view.types";

type LabelChoice = { id: number; name: string; color?: string };
type WhoChoice = { memberUid: string; name: string; former: boolean };

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
    <div className="gap-space-sm border-border/60 pb-space-md flex flex-col border-b sm:flex-row sm:items-center">
      {/* Pills need room for both labels, so they wait for the single row. */}
      <div className="hidden sm:block">
        <ViewPills view={view} />
      </div>

      {/* Its own row on a phone, and what pushes the right-hand end of the
          single row away from the pills. */}
      <div className="sm:ml-auto">
        <TaskSearch path={path} query={query} />
      </div>

      <div className="gap-space-sm flex items-center">
        <div className="sm:hidden">
          <ViewMenu view={view} />
        </div>

        {/* Pushed to the far end of the phone's second row, where the layout
            dropdown holds the other end; already at the end on one row. */}
        <div className="ml-auto sm:ml-0">
          <FilterPanel
            path={path}
            query={query}
            members={members}
            categories={categories}
            tags={tags}
          />
        </div>
      </div>
    </div>
  );
}
