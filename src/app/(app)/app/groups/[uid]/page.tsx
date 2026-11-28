import type { Metadata } from "next";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { loadBoard } from "@/app/(app)/app/groups/[uid]/page.helpers";
import { BoardBar } from "@/components/app/group/board/board-bar/board-bar";
import { TaskList } from "@/components/app/group/board/task-list/task-list";
import { TaskPager } from "@/components/app/group/board/task-pager/task-pager";
import { RoundPanel } from "@/components/app/group/board/task-panel/round-panel/round-panel";
import { TaskPanel } from "@/components/app/group/board/task-panel/task-panel";
import { HistoryList } from "@/components/app/group/board/task-panel/task-view/history/history-list";
import { TaskView } from "@/components/app/group/board/task-panel/task-view/task-view";
import { bylineLabel } from "@/components/app/group/board/task-panel/task-view/task-view.helpers";
import { SECTION_COLUMN } from "@/components/app/group/shell/shell.styles";
import { LoadError } from "@/components/common/load-error";
import { loadRoundPageAction } from "@/app/(app)/app/groups/[uid]/actions/actions";
import { getGroup } from "@/lib/groups/groups";
import { groupLabel } from "@/lib/groups/labels/labels";
import {
  canRecordRound,
  canSkipRound,
  roundAlreadyDone,
} from "@/lib/tasks/completions/completions.helpers";
import {
  boardHref,
  EDIT_TASK,
  editTaskHref,
  narrowsBoard,
  NEW_TASK,
  openTaskHref,
  roundId,
  taskQuery,
} from "@/lib/tasks/filter/filter";
import type { TaskSearchParams } from "@/lib/tasks/filter/filter.types";
import {
  assignedElsewhere,
  canArchiveTask,
  canClaimTask,
  canEditTask,
} from "@/lib/tasks/permissions/permissions";
import { readBoardView } from "@/lib/tasks/view/view";
import { taskValues } from "@/lib/tasks/write/write";
import { dayKey } from "@/lib/time/day/day";
import { readTimeZone } from "@/lib/time/zone/zone-cookie";
import { fullName } from "@/lib/users/name/name";

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

  const asking = one(asked.task);
  const askedRound = roundId(one(asked.round));

  const [loaded, timeZone, view] = await Promise.all([
    // Nothing to read for a task being created, which has no uid yet.
    loadBoard(uid, query, myMemberUid, asking === NEW_TASK ? "" : asking, askedRound),
    readTimeZone(),
    readBoardView(),
  ]);
  const { board, failure, members, categories, tags, open, history, round } = loaded;

  // One instant for the whole board, so every row agrees about what "today"
  // means and the browser hydrates to what the server drew.
  const now = new Date();
  const items = board.items ?? [];
  const closeHref = boardHref(path, query, { page: query.page });
  const taskHref = open?.uid ? openTaskHref(path, query, open.uid) : closeHref;
  const editable = open ? canEditTask(open, myMemberUid, group.myRole) : false;
  // Named rather than merely flagged, so the dead press says whose task it is.
  // A name the roster could not resolve still blocks the press.
  const heldBy =
    open && assignedElsewhere(open, myMemberUid)
      ? fullName(open.assignedTo?.name, open.assignedTo?.lastName) || "somebody else"
      : null;

  // A round recorded ahead of schedule holds the next one back, so the press
  // says which round is done instead of refusing a form somebody filled in.
  const doneFor = open && history ? roundAlreadyDone(open, history.rounds, now, timeZone) : null;

  // A round still ahead cannot be written off: nobody has missed it yet, which
  // is the one thing the endpoint allows early completion for and not a skip.
  const skippable = open ? !doneFor && !heldBy && canSkipRound(open, now, timeZone) : false;

  // Only where the task is the reader's to change: the panel would otherwise
  // open a form on a task every save of which the backend refuses.
  const startEditing = editable && one(asked.edit) === EDIT_TASK;

  const creating = asking === NEW_TASK;
  const labels = categories.flatMap((category) =>
    category.id && category.name
      ? [
          {
            id: category.id,
            name: category.name,
            color: category.color,
            icon: category.icon,
          },
        ]
      : [],
  );

  return (
    // The cards layout gives up the app's column so a wide screen fits more
    // across. The group's name in the rail is this screen's heading.
    <section
      className={`gap-space-md flex flex-col ${view === "cards" ? "w-full" : SECTION_COLUMN}`}
    >
      <BoardBar
        path={path}
        query={query}
        view={view}
        members={members}
        categories={labels}
        tags={tags}
      />

      {failure ? (
        <LoadError title="The board would not load" message={failure} />
      ) : (
        <>
          {/* A container, so the cards count their columns off the width the
              board has rather than the window's. */}
          <div className="gap-space-md @container flex flex-col">
            <TaskList
              tasks={items}
              categories={categories}
              view={view}
              narrowed={narrowsBoard(query)}
              path={path}
              hrefFor={(taskUid) => openTaskHref(path, query, taskUid)}
              editHrefFor={(taskUid) => editTaskHref(path, query, taskUid)}
              groupUid={uid}
              myMemberUid={myMemberUid}
              myRole={group.myRole}
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

          {open && round ? (
            <RoundPanel
              round={round}
              label={open.name ?? "Task details"}
              backHref={taskHref}
              now={now}
              timeZone={timeZone}
            />
          ) : null}

          {(open && !round) || creating ? (
            <TaskPanel
              view={
                open ? (
                  <TaskView
                    task={open}
                    category={categories.find((held) => held.id === open.categoryId)}
                    groupUid={uid}
                    canClaim={canClaimTask(open)}
                    now={now}
                    timeZone={timeZone}
                    history={
                      history && open.uid ? (
                        <HistoryList
                          // Keyed on the count, so a round recorded just now
                          // remounts the list: it holds its pages in state and
                          // a revalidated page would not reach them.
                          key={history.total}
                          loadMore={loadRoundPageAction.bind(null, open.uid)}
                          first={history}
                          taskHref={taskHref}
                          now={now}
                          timeZone={timeZone}
                        />
                      ) : null
                    }
                  />
                ) : null
              }
              label={open?.name ?? "Task details"}
              creating={creating}
              startEditing={startEditing}
              groupUid={uid}
              taskUid={open?.uid}
              values={taskValues(open ?? null, timeZone)}
              photoUid={open?.photoUid ?? null}
              categories={labels}
              tags={tags}
              members={members}
              today={dayKey(now, timeZone)}
              byline={bylineLabel(open ?? null, now, timeZone)}
              canEdit={editable}
              canComplete={open ? canRecordRound(open) : true}
              heldBy={heldBy}
              doneFor={doneFor}
              canSkip={skippable}
              canArchive={open ? canArchiveTask(open, myMemberUid, group.myRole) : false}
              path={path}
              query={query}
              closeHref={closeHref}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
