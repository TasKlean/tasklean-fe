// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deleteTaskAction = vi.fn(async (_groupUid: string, _taskUid: string) => ({
  error: null as string | null,
}));

const archiveTaskAction = vi.fn(async (_groupUid: string, _taskUid: string) => ({
  error: null as string | null,
}));

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  deleteTaskAction: (groupUid: string, taskUid: string) => deleteTaskAction(groupUid, taskUid),
  archiveTaskAction: (groupUid: string, taskUid: string) => archiveTaskAction(groupUid, taskUid),
  claimTaskAction: vi.fn(),
}));

import { RowPress } from "@/components/app/group/board/task-row/row-press";

const VIEW = "/app/groups/g1?task=t1";
const EDIT = "/app/groups/g1?task=t1&edit=1";

function row(canEdit = true) {
  return render(
    <ul>
      <RowPress
        actions={{
          groupUid: "g1",
          taskUid: "t1",
          name: "Mop the floor",
          viewHref: VIEW,
          editHref: EDIT,
          canEdit,
          canClaim: false,
          canArchive: canEdit,
        }}
      >
        <a href={VIEW}>Mop the floor</a>
      </RowPress>
    </ul>,
  );
}

/** Holds a finger on the row for longer than the menu asks for. */
function hold(pointerType = "touch") {
  const item = screen.getByRole("listitem");
  vi.useFakeTimers();

  fireEvent.pointerDown(item, { pointerType, clientX: 10, clientY: 10 });
  act(() => void vi.advanceTimersByTime(700));
  fireEvent.pointerUp(item, { pointerType });
  vi.useRealTimers();

  return item;
}

beforeEach(() => {
  deleteTaskAction.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RowPress", () => {
  it("keeps the menu shut until it is asked for", () => {
    row();

    expect(screen.queryByRole("link", { name: "View" })).toBeNull();
  });

  it("opens the menu on a press of the three dots", async () => {
    const user = userEvent.setup();
    row();
    await user.click(screen.getByRole("button", { name: "More for Mop the floor" }));

    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", VIEW);
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", EDIT);
  });

  it("offers reading alone where the task is not the reader's to change", async () => {
    const user = userEvent.setup();
    row(false);
    await user.click(screen.getByRole("button", { name: /^More/ }));

    expect(screen.getByRole("link", { name: "View" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("opens the menu on a finger held on the row, which is the phone's way in", () => {
    row();
    hold();

    expect(screen.getByRole("link", { name: "View" })).toBeVisible();
  });

  it("swallows the press the hold ends in, so the task does not open over it", () => {
    row();
    const item = hold();

    expect(fireEvent.click(item)).toBe(false);
  });

  it("ignores a mouse held down, which has the three dots and means to select", () => {
    row();
    hold("mouse");

    expect(screen.queryByRole("link", { name: "View" })).toBeNull();
  });

  it("gives up the hold once the finger has moved, which is a scroll", () => {
    row();
    const item = screen.getByRole("listitem");
    vi.useFakeTimers();

    fireEvent.pointerDown(item, { pointerType: "touch", clientX: 10, clientY: 10 });
    fireEvent.pointerMove(item, { pointerType: "touch", clientX: 10, clientY: 90 });
    act(() => void vi.advanceTimersByTime(700));
    vi.useRealTimers();

    expect(screen.queryByRole("link", { name: "View" })).toBeNull();
  });

  it("asks before it deletes anything", async () => {
    const user = userEvent.setup();
    row();
    await user.click(screen.getByRole("button", { name: /^More/ }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteTaskAction).not.toHaveBeenCalled();
    expect(screen.getByText(/Nothing brings it back/)).toBeVisible();
  });

  it("deletes the task once the question is answered", async () => {
    const user = userEvent.setup();
    row();
    await user.click(screen.getByRole("button", { name: /^More/ }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete for good" }));

    expect(deleteTaskAction).toHaveBeenCalledWith("g1", "t1");
  });

  it("keeps the task and says why it is still there when the delete is refused", async () => {
    deleteTaskAction.mockResolvedValueOnce({ error: "Somebody else owns that task." });
    const user = userEvent.setup();
    row();
    await user.click(screen.getByRole("button", { name: /^More/ }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete for good" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Somebody else owns that task.");
  });
});

describe("RowPress archiving", () => {
  it("asks before retiring the task, which nothing undoes", async () => {
    row();
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));
    await userEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(archiveTaskAction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Archive it" }));

    expect(archiveTaskAction).toHaveBeenCalledWith("g1", "t1");
  });

  it("offers no archive to a reader the task is not theirs to change", async () => {
    row(false);
    await userEvent.click(screen.getByRole("button", { name: "More for Mop the floor" }));

    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  });
});
