// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createTaskAction = vi.fn(async () => ({ error: null, savedUid: "t9" }));

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  createTaskAction: () => createTaskAction(),
  updateTaskAction: vi.fn(),
  deleteTaskAction: vi.fn(),
  createTaskTagAction: vi.fn(),
}));

const router = { push: vi.fn(), replace: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));

vi.mock("@/app/(app)/uploads/actions/actions", () => ({ requestUploadAction: vi.fn() }));

import { TaskPanel } from "@/components/app/group/board/task-panel/task-panel";
import { taskQuery } from "@/lib/tasks/filter/filter";
import { taskValues } from "@/lib/tasks/write/write";

const ZONE = "Europe/Ljubljana";
const QUERY = taskQuery({});
const CLOSE = "/app/groups/g1";

function panel(view: React.ReactNode | null, startEditing = false) {
  return (
    <TaskPanel
      view={view}
      label={view ? "Mop the floor" : "New task"}
      creating={view === null}
      startEditing={startEditing}
      groupUid="g1"
      taskUid={view ? "t9" : undefined}
      values={taskValues(null, ZONE)}
      photoUid={null}
      categories={[]}
      tags={[]}
      members={[{ memberUid: "m1", name: "Maja Novak", former: false, self: true }]}
      byline={null}
      canEdit
      path={CLOSE}
      query={QUERY}
      closeHref={CLOSE}
    />
  );
}

beforeEach(() => {
  createTaskAction.mockClear();
  router.push.mockClear();
  router.replace.mockClear();
});

describe("TaskPanel", () => {
  it("opens the form for a chore that does not exist yet", () => {
    render(panel(null));

    expect(screen.getAllByRole("button", { name: "Create task" })[0]).toBeVisible();
  });

  it("leaves the form by the board's own link, which the URL named", () => {
    render(panel(null));

    expect(screen.getByRole("link", { name: "Close" })).toHaveAttribute("href", CLOSE);
  });

  it("shows the facts once a created chore has them, not the form again", async () => {
    const { rerender } = render(panel(null));
    await userEvent.type(screen.getByLabelText(/^Task title/), "Mop the floor");
    await userEvent.click(screen.getAllByRole("button", { name: "Create task" })[1]);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(`${CLOSE}?task=t9`));

    rerender(panel(<p>Every week</p>));

    expect(screen.getByText("Every week")).toBeVisible();
    expect(screen.queryAllByRole("button", { name: "Create task" })).toHaveLength(0);
  });

  it("puts the facts back on a discard, leaving no history entry", async () => {
    render(panel(<p>Every week</p>));
    await userEvent.click(screen.getByRole("button", { name: "Edit task" }));

    expect(screen.getAllByRole("button", { name: "Save changes" })[0]).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(screen.getByText("Every week")).toBeVisible();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("opens the editor where the URL asked for it, a row having no way to", () => {
    render(panel(<p>Every week</p>, true));

    expect(screen.getAllByRole("button", { name: "Save changes" })[0]).toBeVisible();
  });

  it("takes the request out of the URL on a discard, so a reload reads", async () => {
    render(panel(<p>Every week</p>, true));
    await userEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(screen.getByText("Every week")).toBeVisible();
    expect(router.replace).toHaveBeenCalledWith(`${CLOSE}?task=t9`);
  });

  it("opens the editor again for a second chore the URL names", () => {
    const { rerender } = render(panel(<p>Every week</p>, true));
    rerender(panel(<p>Every week</p>, false));
    rerender(panel(<p>Every week</p>, true));

    expect(screen.getAllByRole("button", { name: "Save changes" })[0]).toBeVisible();
  });

  it("leaves the editor by the way back, not by the way out", async () => {
    render(panel(<p>Every week</p>));
    await userEvent.click(screen.getByRole("button", { name: "Edit task" }));

    expect(screen.getByRole("button", { name: "Back" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Close" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByText("Every week")).toBeVisible();
    expect(router.push).not.toHaveBeenCalled();
  });
});
