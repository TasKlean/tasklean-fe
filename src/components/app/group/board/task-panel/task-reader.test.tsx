// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteTaskAction = vi.fn<(group: string, task: string) => Promise<{ error: string | null }>>(
  async () => ({ error: null }),
);

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  deleteTaskAction: (group: string, task: string) => deleteTaskAction(group, task),
}));

const router = { push: vi.fn(), replace: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { TaskReader } from "@/components/app/group/board/task-panel/task-reader";

const onEdit = vi.fn();

function reader(canEdit = true) {
  return render(
    <TaskReader
      label="Bins"
      groupUid="g1"
      taskUid="t1"
      closeHref="/app/groups/g1"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <p>the facts</p>
    </TaskReader>,
  );
}

beforeEach(() => {
  deleteTaskAction.mockClear();
  router.push.mockClear();
  onEdit.mockClear();
});

describe("TaskReader", () => {
  it("asks before deleting a chore, which nothing brings back", async () => {
    reader();
    await userEvent.click(screen.getByRole("button", { name: "Delete task" }));

    expect(deleteTaskAction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Delete for good" }));

    await waitFor(() => expect(deleteTaskAction).toHaveBeenCalledWith("g1", "t1"));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/app/groups/g1"));
  });

  it("reports a refused delete in the panel, and stays on the chore", async () => {
    deleteTaskAction.mockResolvedValueOnce({
      error: "This chore is not yours to delete. Its author or an admin can.",
    });

    reader();
    await userEvent.click(screen.getByRole("button", { name: "Delete task" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete for good" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("not yours to delete");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("offers neither press to a reader the chore is not theirs to change", () => {
    reader(false);

    expect(screen.queryByRole("button", { name: "Delete task" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit task" })).toBeNull();
    expect(screen.getByText("the facts")).toBeInTheDocument();
  });
});
