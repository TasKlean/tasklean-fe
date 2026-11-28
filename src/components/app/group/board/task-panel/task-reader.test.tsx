// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteTaskAction = vi.fn<(group: string, task: string) => Promise<{ error: string | null }>>(
  async () => ({ error: null }),
);

const archiveTaskAction = vi.fn(async (_groupUid: string, _taskUid: string) => ({
  error: null as string | null,
}));

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  deleteTaskAction: (group: string, task: string) => deleteTaskAction(group, task),
  archiveTaskAction: (group: string, task: string) => archiveTaskAction(group, task),
  completeTaskAction: async () => ({ error: null, done: "Marked done." }),
}));

const router = { push: vi.fn(), replace: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { TaskReader } from "@/components/app/group/board/task-panel/task-reader";

const onEdit = vi.fn();
const onComplete = vi.fn();
const onSkip = vi.fn();
const onNotice = vi.fn();

function reader(overrides: Partial<React.ComponentProps<typeof TaskReader>> = {}) {
  return render(
    <TaskReader
      label="Bins"
      groupUid="g1"
      taskUid="t1"
      closeHref="/app/groups/g1"
      requiresProof={false}
      canComplete
      heldBy={null}
      doneFor={null}
      canSkip
      canArchive
      canEdit
      notice={null}
      onNotice={onNotice}
      onEdit={onEdit}
      onComplete={onComplete}
      onSkip={onSkip}
      {...overrides}
    >
      <p>the facts</p>
    </TaskReader>,
  );
}

beforeEach(() => {
  deleteTaskAction.mockClear();
  router.push.mockClear();
  onEdit.mockClear();
  onComplete.mockClear();
  onNotice.mockClear();
});

describe("TaskReader", () => {
  it("asks before deleting a task, which nothing brings back", async () => {
    reader();
    await userEvent.click(screen.getByRole("button", { name: "Delete task" }));

    expect(deleteTaskAction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Delete for good" }));

    await waitFor(() => expect(deleteTaskAction).toHaveBeenCalledWith("g1", "t1"));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/app/groups/g1"));
  });

  it("reports a refused delete in the panel, and stays on the task", async () => {
    deleteTaskAction.mockResolvedValueOnce({
      error: "This task is not yours to delete. Its author or an admin can.",
    });

    reader();
    await userEvent.click(screen.getByRole("button", { name: "Delete task" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete for good" }));

    await waitFor(() =>
      expect(onNotice).toHaveBeenCalledWith({
        tone: "error",
        text: "This task is not yours to delete. Its author or an admin can.",
      }),
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("offers neither press to a reader the task is not theirs to change", () => {
    reader({ canEdit: false });

    expect(screen.queryByRole("button", { name: "Delete task" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit task" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Complete" }).length).toBeGreaterThan(0);
  });

  it("draws no Complete press on a task that is done for good", () => {
    reader({ canComplete: false });

    expect(screen.queryByRole("button", { name: "Complete" })).toBeNull();
    expect(screen.getByRole("button", { name: "Edit task" })).toBeInTheDocument();
  });

  it("shows what the last press said", () => {
    reader({ notice: { tone: "success", text: "Marked done. It comes round again tomorrow." } });

    expect(screen.getByText("Marked done. It comes round again tomorrow.")).toBeInTheDocument();
  });
});

describe("TaskReader archiving", () => {
  beforeEach(() => {
    archiveTaskAction.mockClear();
  });

  it("asks in place before retiring the task", async () => {
    reader();
    await userEvent.click(screen.getByRole("button", { name: "Archive task" }));

    expect(archiveTaskAction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Archive it" }));

    expect(archiveTaskAction).toHaveBeenCalledWith("g1", "t1");
  });

  it("stands the delete aside while the archive question is up, the row being one", async () => {
    reader();
    await userEvent.click(screen.getByRole("button", { name: "Archive task" }));

    expect(screen.queryByRole("button", { name: "Delete task" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit task" })).toBeNull();
  });

  it("draws no archive press on a task that is archived already", () => {
    reader({ canArchive: false });

    expect(screen.queryByRole("button", { name: "Archive task" })).toBeNull();
  });
});
