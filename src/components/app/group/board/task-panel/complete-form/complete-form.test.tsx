// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type State = { error: string | null; done: string | null };

const completeTaskAction = vi.fn<(previous: State, data: FormData) => Promise<State>>(async () => ({
  error: null,
  done: "Marked done. This task is finished.",
}));

vi.mock("@/app/(app)/app/groups/[uid]/actions/actions", () => ({
  completeTaskAction: (previous: State, data: FormData) => completeTaskAction(previous, data),
}));

vi.mock("@/app/(app)/uploads/actions/actions", () => ({ requestUploadAction: vi.fn() }));

const router = { push: vi.fn(), replace: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { CompleteForm } from "@/components/app/group/board/task-panel/complete-form/complete-form";

const onCancel = vi.fn();
const onDone = vi.fn();

function form(requiresProof = false) {
  return render(
    <CompleteForm
      groupUid="g1"
      taskUid="t1"
      label="Bins"
      requiresProof={requiresProof}
      onCancel={onCancel}
      onDone={onDone}
    />,
  );
}

/** Reads what the round posted. */
function posted(): Record<string, string> {
  const data = completeTaskAction.mock.calls[0]?.[1];

  return Object.fromEntries(
    [...(data?.entries() ?? [])].map(([key, value]) => [key, String(value)]),
  );
}

beforeEach(() => {
  completeTaskAction.mockClear();
  onCancel.mockClear();
  onDone.mockClear();
});

describe("CompleteForm", () => {
  it("posts what the round took beside the task it was", async () => {
    form();
    await userEvent.click(screen.getByRole("button", { name: "30m" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Note" }), "The mop is worn out.");
    await userEvent.click(screen.getByRole("button", { name: "Mark as done" }));

    await waitFor(() => expect(completeTaskAction).toHaveBeenCalled());
    expect(posted()).toEqual({
      groupUid: "g1",
      taskUid: "t1",
      minutes: "30",
      note: "The mop is worn out.",
    });
  });

  it("records a round nobody timed, the estimate standing in for it", async () => {
    form();
    await userEvent.click(screen.getByRole("button", { name: "Mark as done" }));

    await waitFor(() => expect(completeTaskAction).toHaveBeenCalled());
    expect(posted()).toEqual({ groupUid: "g1", taskUid: "t1", minutes: "", note: "" });
  });

  it("will not post a task that asks for proof with no photo", async () => {
    form(true);
    await userEvent.click(screen.getByRole("button", { name: "Mark as done" }));

    expect(completeTaskAction).not.toHaveBeenCalled();
    expect(await screen.findByText("This task needs a photo to be marked done.")).toBeVisible();
  });

  it("hands the line back, so the facts behind it can say what happened", async () => {
    form();
    await userEvent.click(screen.getByRole("button", { name: "Mark as done" }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith("Marked done. This task is finished."));
  });

  it("reports a refusal where it was pressed, and stays on the form", async () => {
    completeTaskAction.mockResolvedValueOnce({
      error: "This task is assigned to somebody else.",
      done: null,
    });

    form();
    await userEvent.click(screen.getByRole("button", { name: "Mark as done" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("somebody else");
    expect(onDone).not.toHaveBeenCalled();
  });
});
