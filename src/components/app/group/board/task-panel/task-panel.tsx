/**
 * One chore, opened over the board. `?task=<uid>` reads one and `?task=new` is
 * the form for one that does not exist yet, so both are links somebody can
 * send, survive a reload and close with an ordinary navigation.
 *
 * **Editing an existing chore is the panel's own state**, because it crosses no
 * navigation: Discard puts the facts straight back with no round trip and no
 * history entry nobody wants to walk back through. Creating one does cross a
 * navigation, the presses that start it being in the chrome, which is what the
 * URL is for, and so does a row's own Edit, which `?edit=1` carries.
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { TaskEditor } from "@/components/app/group/board/task-panel/task-editor";
import { TaskReader } from "@/components/app/group/board/task-panel/task-reader";
import { openTaskHref } from "@/lib/tasks/filter/filter";
import type { LabelChoice, TaskQuery, WhoChoice } from "@/lib/tasks/filter/filter.types";
import type { TaskValues } from "@/lib/validation/forms/task.schema/task.schema";

type TaskPanelProps = {
  // The chore as it reads, rendered on the server and handed down, since this
  // component holds the press that puts the form in its place. Null for one
  // that does not exist yet.
  view: ReactNode | null;
  // The chore's own name, which is what the panel is announced as.
  label: string;
  // True for `?task=new`, which opens the form rather than any chore.
  creating: boolean;
  // True for `?edit=1`, which is how a press outside the panel asks for the
  // editor: a row on the board cannot reach the state this component holds.
  startEditing: boolean;
  groupUid: string;
  taskUid?: string;
  values: TaskValues;
  photoUid: string | null;
  categories: readonly LabelChoice[];
  tags: readonly LabelChoice[];
  members: readonly WhoChoice[];
  // Who wrote the chore down and when, which the editor keeps in its header.
  byline: string | null;
  // False where the chore is not the reader's to change. UX only: every write
  // handles its own 403.
  canEdit: boolean;
  // The board's own path and filter, so the panel can name the chore it saved
  // without a function crossing into the browser.
  path: string;
  query: TaskQuery;
  closeHref: string;
};

/** Renders the chore the URL names, as facts or as the form. */
export function TaskPanel({
  view,
  label,
  creating,
  startEditing,
  groupUid,
  taskUid,
  values,
  photoUid,
  categories,
  tags,
  members,
  byline,
  canEdit,
  path,
  query,
  closeHref,
}: Readonly<TaskPanelProps>) {
  const router = useRouter();
  const [editing, setEditing] = useState(startEditing);

  // The URL's own answer, kept so a change to it wins over the state left by
  // the chore before it: Edit on a second row must open the second editor.
  const [asked, setAsked] = useState(`${taskUid}:${startEditing}`);
  const now = `${taskUid}:${startEditing}`;

  if (now !== asked) {
    setAsked(now);
    setEditing(startEditing);
  }

  /** Puts the chore's own URL back, where the editor was asked for by one. */
  const stopAsking = useCallback(
    (uid: string) => {
      router.replace(openTaskHref(path, query, uid));
    },
    [router, path, query],
  );

  const onSaved = useCallback(
    (uid: string) => {
      setEditing(false);

      // A new chore has a URL of its own to take up, which is what fetches the
      // facts. The form stays up until they arrive, both props changing at
      // once, so nothing flashes in between. One opened by `?edit=1` only has
      // to stop saying so, or a reload would reopen the form over the facts.
      if (creating || startEditing) stopAsking(uid);
    },
    [creating, startEditing, stopAsking],
  );

  const onDiscard = useCallback(() => {
    setEditing(false);
    if (startEditing && taskUid) stopAsking(taskUid);
  }, [startEditing, taskUid, stopAsking]);

  if (creating || (editing && view)) {
    return (
      <TaskEditor
        mode={creating ? "create" : "edit"}
        groupUid={groupUid}
        taskUid={creating ? undefined : taskUid}
        values={values}
        photoUid={photoUid}
        categories={categories}
        tags={tags}
        members={members}
        byline={byline}
        closeHref={closeHref}
        onDiscard={onDiscard}
        onSaved={onSaved}
      />
    );
  }

  if (!view) return null;

  return (
    <TaskReader
      label={label}
      groupUid={groupUid}
      taskUid={taskUid}
      closeHref={closeHref}
      canEdit={canEdit}
      onEdit={() => setEditing(true)}
    >
      {view}
    </TaskReader>
  );
}
