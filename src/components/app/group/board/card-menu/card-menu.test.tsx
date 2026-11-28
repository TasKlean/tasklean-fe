// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteTaskAction = vi.fn();
const archiveTaskAction = vi.fn(async (_groupUid: string, _taskUid: string) => ({
  error: null as string | null,
}));
const claimTaskAction = vi.fn(async (_groupUid: string, _taskUid: string) => ({
  error: null as string | null,
}));

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  deleteTaskAction: (groupUid: string, taskUid: string) => deleteTaskAction(groupUid, taskUid),
  archiveTaskAction: (groupUid: string, taskUid: string) => archiveTaskAction(groupUid, taskUid),
  claimTaskAction: (groupUid: string, taskUid: string) => claimTaskAction(groupUid, taskUid),
}));

import { CardMenu } from "@/components/app/group/board/card-menu/card-menu";

const HREF = "/app/groups/g1?task=t1";

function menu(canEdit = true, canClaim = false) {
  return render(
    <CardMenu
      groupUid="g1"
      taskUid="t1"
      name="Mop the floor"
      viewHref={HREF}
      canEdit={canEdit}
      canClaim={canClaim}
      canArchive={canEdit}
    />,
  );
}

describe("CardMenu", () => {
  beforeEach(() => {
    deleteTaskAction.mockReset();
    archiveTaskAction.mockClear();
    claimTaskAction.mockClear();
  });

  it("names the task it is about, a grid of More buttons naming nothing", () => {
    menu();

    expect(screen.getByRole("button", { name: "More for Mop the floor" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("opens the task by its own link, so it survives a reload", async () => {
    menu();
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));

    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", HREF);
  });

  it("offers no Edit, which is the press beside it rather than a row in here", async () => {
    menu();
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));

    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("leaves a reader who may not change the task with View alone", async () => {
    menu(false);
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));

    expect(screen.getByRole("link", { name: "View" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("asks before it deletes, and sends the group with the task", async () => {
    deleteTaskAction.mockResolvedValue({});
    menu();
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText(/Nothing brings it back/)).toBeInTheDocument();
    expect(deleteTaskAction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /Delete for good/ }));

    expect(deleteTaskAction).toHaveBeenCalledWith("g1", "t1");
  });

  it("reports a refused delete and keeps the task on the board", async () => {
    deleteTaskAction.mockResolvedValue({ error: "That task has been removed." });
    menu();
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: /Delete for good/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That task has been removed.");
  });

  it("keeps the task when the question is answered the other way", async () => {
    menu();
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep it" }));

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(deleteTaskAction).not.toHaveBeenCalled();
  });

  it("asks before archiving, which nothing undoes either", async () => {
    menu();
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));
    await userEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(archiveTaskAction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Archive it" }));

    expect(archiveTaskAction).toHaveBeenCalledWith("g1", "t1");
  });

  it("takes the task in one press, there being nothing to lose", async () => {
    menu(false, true);
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));
    await userEvent.click(screen.getByRole("button", { name: "Claim" }));

    expect(claimTaskAction).toHaveBeenCalledWith("g1", "t1");
  });

  it("offers no claim on a task somebody already holds", async () => {
    menu();
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));

    expect(screen.queryByRole("button", { name: "Claim" })).toBeNull();
  });
});
