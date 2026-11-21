import type { Metadata } from "next";
import { BoardBar } from "@/components/app/group/board/board-bar/board-bar";
import { TaskList } from "@/components/app/group/board/task-list/task-list";
import { TaskPager } from "@/components/app/group/board/task-pager/task-pager";
import { TaskPanel } from "@/components/app/group/board/task-panel/task-panel";
import { LoadError } from "@/components/common/load-error";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { loadBoard } from "@/app/(app)/app/groups/[uid]/page.helpers";
import { getGroup } from "@/lib/groups/groups";
import { groupLabel } from "@/lib/groups/labels/labels";
import { boardHref, narrowsBoard, openTaskHref, taskQuery } from "@/lib/tasks/filter/filter";
import type { TaskSearchParams } from "@/lib/tasks/filter/filter.types";
import { readTimeZone } from "@/lib/time/zone/zone-cookie";
import { readBoardView } from "@/lib/tasks/view/view";

/**
 * Titles the tab with the group's own name.
 *
 * @returns The name, or the generic title: a failure here must not take the
 * page, which reports the same load through the shell.
 */
export async function generateMetadata({
  params,
}: PageProps<"/app/groups/[uid]">): Promise<Metadata> {
  const { uid } = await params;

  try {
    const group = await getGroup(uid);
    return { title: groupLabel(group.name) };
  } catch {
    return { title: "Group" };
  }
}

/** Takes the first value of a search param that may have arrived repeated. */
function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Renders a group's board, which is what opening a group shows.
 *
 * `new` and `join` are static segments, so Next matches those routes ahead of
 * this one; a uid is a UUID and can never collide with either.
 */
export default async function GroupTasksPage({
  params,
  searchParams,
}: PageProps<"/app/groups/[uid]">) {
  const { uid } = await params;
  const { group } = await loadGroup(uid);

  // The shell reports a group it could not load and renders no children, so
  // there is nothing left for this screen to say about one.
  if (!group) return null;

  const asked = (await searchParams) as TaskSearchParams;
  const query = taskQuery(asked);
  const path = `/app/groups/${uid}`;
  const myMemberUid = group.myMemberUid ?? null;

  const [loaded, timeZone, view] = await Promise.all([
    loadBoard(uid, query, myMemberUid, one(asked.task)),
    readTimeZone(),
    readBoardView(),
  ]);
  const { board, failure, members, categories, tags, open } = loaded;

  // One instant for the whole board, so every row agrees about what "today"
  // means and the browser hydrates to what the server drew.
  const now = new Date();
  const items = board.items ?? [];
  const closeHref = boardHref(path, query, { page: query.page });

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <h2 className="text-headline-sm text-foreground">Tasks</h2>
        <p className="text-body-md text-muted-foreground">
          The chores this group shares, and who is doing them.
        </p>
      </div>

      <BoardBar
        path={path}
        query={query}
        view={view}
        members={members}
        categories={categories.flatMap((category) =>
          category.id && category.name
            ? [{ id: category.id, name: category.name, color: category.color }]
            : [],
        )}
        tags={tags}
      />

      {failure ? (
        <LoadError title="The board would not load" message={failure} />
      ) : (
        // The panel's column is declared only while a chore is open, or a
        // closed board gives up 22rem of width to an empty track.
        <div
          className={`gap-space-md grid grid-cols-1 items-start ${open ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}
        >
          <div className="gap-space-md flex flex-col">
            <TaskList
              tasks={items}
              categories={categories}
              view={view}
              narrowed={narrowsBoard(query)}
              path={path}
              hrefFor={(taskUid) => openTaskHref(path, query, taskUid)}
              now={now}
              timeZone={timeZone}
            />

            <TaskPager
              page={query.page}
              totalPages={board.totalPages ?? 1}
              totalTasks={board.totalTasks ?? 0}
              shown={items.length}
              size={board.size ?? 20}
              hrefFor={(page) => boardHref(path, query, { page })}
            />
          </div>

          {open ? (
            <TaskPanel
              task={open}
              category={categories.find((one) => one.id === open?.categoryId)}
              closeHref={closeHref}
              now={now}
              timeZone={timeZone}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
