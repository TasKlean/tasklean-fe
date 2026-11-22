/**
 * The board's chores, in whichever layout the reader chose, or the reason
 * there are none. The category each chore shows is looked up here rather than
 * per row: a chore carries a numeric id and the household's categories are
 * read once for the whole page.
 */

import { NoTasks } from "@/components/app/group/board/no-tasks/no-tasks";
import { TaskCard } from "@/components/app/group/board/task-card/task-card";
import { TaskRow } from "@/components/app/group/board/task-row/task-row";
import type { Category } from "@/lib/labels/categories/categories.types";
import type { Task } from "@/lib/tasks/tasks/tasks.types";
import type { BoardView } from "@/lib/tasks/view/view.types";

type TaskListProps = {
  tasks: readonly Task[];
  categories: readonly Category[];
  view: BoardView;
  // Whether anything is hiding a chore, which decides what an empty board says.
  narrowed: boolean;
  path: string;
  // Builds the link that opens one chore, which is this path plus `?task=`.
  hrefFor: (uid: string) => string;
  now: Date;
  timeZone: string;
};

const LIST = "gap-space-sm flex flex-col";

// Counted off the board's own width, not the window's, so an open chore drops a
// column rather than squeezing one in. The steps keep a card near 300px and up.
const GRID = "gap-space-sm grid grid-cols-1 @xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-4";

/** Renders the chores on this page of the board. */
export function TaskList({
  tasks,
  categories,
  view,
  narrowed,
  path,
  hrefFor,
  now,
  timeZone,
}: Readonly<TaskListProps>) {
  if (tasks.length === 0) return <NoTasks narrowed={narrowed} path={path} />;

  const byId = new Map(categories.filter((one) => one.id).map((one) => [one.id, one]));

  return (
    <ul className={view === "cards" ? GRID : LIST}>
      {tasks.map((task) => {
        const shared = {
          task,
          category: task.categoryId ? byId.get(task.categoryId) : undefined,
          href: hrefFor(task.uid ?? ""),
          now,
          timeZone,
        };

        return view === "cards" ? (
          <TaskCard key={task.uid} {...shared} />
        ) : (
          <TaskRow key={task.uid} {...shared} />
        );
      })}
    </ul>
  );
}
